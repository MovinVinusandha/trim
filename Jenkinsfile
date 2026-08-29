pipeline {
    agent any

    environment {
        // --- GLOBAL CONFIGURATION ---
        GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        
        // --- AWS CONFIGURATION ---
        AWS_REGION = "us-east-1"
        AWS_ACCOUNT_ID = "878311410498"
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        BACKEND_IMAGE = "${ECR_REGISTRY}/trim-backend"
        FRONTEND_IMAGE = "${ECR_REGISTRY}/trim-frontend"
    }

    stages {
        stage('Initialize') {
            steps { checkout scm }
        }

        stage('CI: Secret Scan (Gitleaks)') {
            when { 
                beforeAgent true
                anyOf {
                    changeRequest();
                    branch 'dev';
                    branch 'staging';
                    branch 'main'
                }
            }
            agent {
                docker {
                    image 'zricethezav/gitleaks:latest';
                    reuseNode true;
                    args '--entrypoint=""'
                }
            }
            steps {
                echo "Scanning repository for hardcoded secrets, AWS keys, and passwords..."
                sh 'gitleaks detect --source . -v --redact'
                echo "No secrets found! Repository is clean."
            }
        }

        // ===================================================================================
        // CI: CODE QUALITY & TESTING 
        // Runs on Pull Requests, and when merging to Staging or Main.
        // ===================================================================================
        stage('CI: Code Quality & Testing') {
            when { 
                anyOf {
                    changeRequest(); 
                    branch 'staging'; 
                    branch 'main' 
                }
            }
            parallel {
                stage('Backend: Test & Scan') {
                    agent {
                        docker {
                            image 'maven:3.9-eclipse-temurin-21-alpine';
                            reuseNode true;
                            args '-u 0:0 -e HOME=/tmp -v maven-repo-cache:/tmp/.m2'
                        }
                    }
                    steps {
                        dir('backend') {
                            sh 'chmod +x mvnw'
                            withSonarQubeEnv('SonarQube-Server') {
                                sh './mvnw clean test jacoco:report org.sonarsource.scanner.maven:sonar-maven-plugin:sonar -Dsonar.projectKey=trim-backend -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml'
                            }
                        }
                    }
                }
                stage('Frontend: Test & Coverage') {
                    agent {
                        docker { image 'node:20-alpine'; reuseNode true; args '-u 0:0 -e HOME=/tmp -v npm-cache:/tmp/.npm' }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run test -- --coverage'
                        }
                    }
                }
            }
        }

        stage('CI: Frontend SonarQube Scan') {
            when { 
                beforeAgent true
                anyOf { 
                    changeRequest(); 
                    branch 'staging'; 
                    branch 'main' 
                } 
            }
            agent {
                docker { 
                    image 'sonarsource/sonar-scanner-cli:latest'; 
                    reuseNode true; 
                    args '-u 0:0 -e HOME=/tmp -v sonar-cache:/tmp/.sonar' 
                }
            }
            steps {
                dir('frontend') {
                    withSonarQubeEnv('SonarQube-Server') {
                        sh 'sonar-scanner -Dsonar.projectKey="trim-frontend" -Dsonar.projectName="Trim Frontend" -Dsonar.sources=src -Dsonar.exclusions="**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/*.spec.ts,src/test/**,src/vite-env.d.ts,src/main.tsx" -Dsonar.tests=src -Dsonar.test.inclusions="**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/*.spec.ts" -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info'
                    }
                }
            }
        }

        stage('CI: Quality Gate') {
            when { 
                anyOf { 
                    changeRequest(); 
                    branch 'staging'; 
                    branch 'main' 
                } 
            }
            steps {
                echo "Waiting for SonarQube to grade both Backend and Frontend..."
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo "Quality Gate Passed!"
            }
        }

        // ===================================================================================
        // 🚀 CD: STAGING DEPLOYMENT 
        // Runs ONLY when code is merged into 'staging'.
        // ===================================================================================
        stage('CD STAGING: Build & Push Images to ECR') {
            when { 
                branch 'staging' 
            }
            steps {
                echo "Building Docker Images for Staging..."
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh "docker run --rm -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} amazon/aws-cli ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"

                    script {
                        parallel(
                            "Build Backend": {
                                sh "docker build --build-arg COMMIT_SHA=${GIT_SHA} -t ${BACKEND_IMAGE}:staging -t ${BACKEND_IMAGE}:${GIT_SHA} -t ${BACKEND_IMAGE}:latest ./backend"
                                sh "docker push ${BACKEND_IMAGE}:staging"
                                sh "docker push ${BACKEND_IMAGE}:${GIT_SHA}"
                                sh "docker push ${BACKEND_IMAGE}:latest"
                            },
                            "Build Frontend": {
                                withCredentials([
                                    string(credentialsId: 'STAGING_VITE_API_URL', variable: 'VITE_API'),
                                    string(credentialsId: 'STAGING_VITE_ROOT_DOMAIN', variable: 'VITE_ROOT')
                                ]) {
                                    sh "docker build --build-arg COMMIT_SHA=${GIT_SHA} --build-arg VITE_API_BASE_URL=${VITE_API} --build-arg VITE_ROOT_DOMAIN=${VITE_ROOT} -t ${FRONTEND_IMAGE}:staging -t ${FRONTEND_IMAGE}:${GIT_SHA} -t ${FRONTEND_IMAGE}:latest ./frontend"
                                }
                                sh "docker push ${FRONTEND_IMAGE}:staging"
                                sh "docker push ${FRONTEND_IMAGE}:${GIT_SHA}"
                                sh "docker push ${FRONTEND_IMAGE}:latest"
                            }
                        )
                    }
                }
            }
        }

        stage('Sec: Trivy OS Vulnerability Scan') {
            when { 
                branch 'staging' 
            }
            steps {
                echo "Scanning Backend (Spring Boot / Alpine OS) Container for Vulnerabilities..."
                sh """
                docker run --rm \\
                    -v /var/run/docker.sock:/var/run/docker.sock \\
                    aquasec/trivy:latest image \\
                    --exit-code 1 \\
                    --severity CRITICAL \\
                    --scanners vuln \\
                    --pkg-types os \\
                    --no-progress \\
                    \${BACKEND_IMAGE}:staging
                """

                echo "Scanning Frontend (Nginx / Alpine OS) Container for Vulnerabilities..."
                sh """
                docker run --rm \\
                    -v /var/run/docker.sock:/var/run/docker.sock \\
                    aquasec/trivy:latest image \\
                    --exit-code 1 \\
                    --severity CRITICAL \\
                    --scanners vuln \\
                    --pkg-types os \\
                    --no-progress \\
                    \${FRONTEND_IMAGE}:staging
                """
            }
        }

        stage('CD STAGING: Deploy to EC2') {
            when { 
                branch 'staging' 
            }
            steps {
                echo "Deploying to EC2 Staging Server..."
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'STAGING_SSH_KEY', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'STAGING_IP', variable: 'SERVER_IP'),
                    file(credentialsId: 'STAGING_ENV_FILE', variable: 'ENV_FILE')
                ]) {
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no \$ENV_FILE \$SSH_USER@\$SERVER_IP:~/.env"
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no docker-compose.staging.yml \$SSH_USER@\$SERVER_IP:~/docker-compose.yml"
                    
                    sh """
                    ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no \${SSH_USER}@\${SERVER_IP} << EOF
sudo mkdir -p /opt/trim-staging
sudo mv ~/.env /opt/trim-staging/.env
sudo mv ~/docker-compose.yml /opt/trim-staging/docker-compose.yml
sudo chown -R \${SSH_USER}:\${SSH_USER} /opt/trim-staging
sudo chmod -R 775 /opt/trim-staging

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
cd /opt/trim-staging
docker compose pull
docker compose up -d --build --wait --timeout 90
EOF
                    """
                }
            }
        }

        stage('QA: Playwright E2E Tests') {
            when { 
                beforeAgent true
                branch 'staging' 
            }
            agent {
                docker { 
                    image 'mcr.microsoft.com/playwright:v1.62.1-jammy';
                    reuseNode true;
                    args '-u 0:0 -e HOME=/tmp -v npm-cache:/tmp/.npm'
                }
            }
            steps {
                echo "Running Playwright E2E Robot against Live Staging URL..."
                dir('frontend') { 
                    sh 'npm ci'
                    sh 'PLAYWRIGHT_BASE_URL=http://trim-s.movinvinusandha.me npx playwright test'
                }
            }
        }

        // ===================================================================================
        // CD: PRODUCTION DEPLOYMENT 
        // Runs ONLY when code is merged into the 'main' branch.
        // ===================================================================================
        stage('CD PROD: Verify Image Promotion') {
            when { 
                branch 'main' 
            }
            steps {
                echo "Backend image ${BACKEND_IMAGE}:${GIT_SHA} is already verified in ECR from the Staging build. Proceeding to deploy."
            }
        }

        stage('CD PROD: Build Static Frontend') {
            when { 
                beforeAgent true
                branch 'main' 
            }
            agent {
                docker { 
                    image 'node:20-alpine'; 
                    reuseNode true; 
                    args '-u 0:0 -e HOME=/tmp -v npm-cache:/tmp/.npm' 
                }
            }
            steps {
                echo "Building Production React App for S3..."
                dir('frontend') {
                    withCredentials([
                        string(credentialsId: 'PROD_VITE_API_URL', variable: 'VITE_API'),
                        string(credentialsId: 'PROD_VITE_ROOT_DOMAIN', variable: 'VITE_ROOT')
                    ]) {
                        sh 'npm ci'
                        sh 'VITE_API_BASE_URL=${VITE_API} VITE_ROOT_DOMAIN=${VITE_ROOT} VITE_APP_VERSION=${GIT_SHA} npm run build'
                    }
                }
            }
        }

        stage('CD PROD: Deploy to AWS Serverless') {
            when { 
                beforeAgent true
                branch 'main' 
            }
            agent {
                docker { 
                    image 'amazon/aws-cli:latest'; 
                    reuseNode true; 
                    args '--entrypoint="" -u 0:0 -e HOME=/tmp' 
                }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'CF_SPA_DIST_ID', variable: 'SPA_DIST_ID'),
                    string(credentialsId: 'CF_MARKETING_DIST_ID', variable: 'MARKETING_DIST_ID')
                ]) {
                    echo "Deploying Frontend to S3..."
                    sh "aws s3 sync frontend/dist s3://trim-app-spa-prod --delete --region ${AWS_REGION}"
                    sh "aws s3 sync frontend/dist s3://trim-marketing-web-prod --delete --region ${AWS_REGION}"

                    echo "Invalidating CloudFront Caches..."
                    sh "aws cloudfront create-invalidation --distribution-id \${SPA_DIST_ID} --paths '/*'"
                    sh "aws cloudfront create-invalidation --distribution-id \${MARKETING_DIST_ID} --paths '/*'"

                    echo "Deploying Backend to ECS Fargate (Zero-Downtime Update)..."
                    sh "aws ecs update-service --cluster trim-prod-cluster --service trim-prod-service --force-new-deployment --region ${AWS_REGION}"

                    echo "Waiting for AWS Health Checks to pass..."
                    sh "aws ecs wait services-stable --cluster trim-prod-cluster --services trim-prod-service --region ${AWS_REGION}"
                }
            }
        }
    }

    post {
        always {
            sh "docker container prune -f"
            sh "docker image prune -a -f --filter 'until=24h' || true"
            sh "docker builder prune -f --filter 'until=24h' || true"
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed! Please check the logs."
        }
    }
}