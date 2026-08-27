pipeline {
    agent any

    environment {
        // --- GLOBAL CONFIGURATION ---
        DOCKER_REGISTRY = "movinvinusandha" // Your DockerHub (for staging)
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/trim-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/trim-frontend"
        GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        
        // --- AWS PRODUCTION CONFIGURATION ---
        AWS_REGION = "us-east-1"
        AWS_ACCOUNT_ID = "878311410498"
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        PROD_BACKEND_IMAGE = "${ECR_REGISTRY}/trim-api"
    }

    stages {
        stage('Initialize') {
            steps {
                checkout scm
            }
        }

        // ===================================================================================
        // CI: CODE QUALITY & TESTING (Runs on PRs, Staging, and Main)
        // ===================================================================================
        stage('CI: Code Quality & Testing') {
            when { 
                anyOf { 
                    // changeRequest() // Runs on all Pull Requests
                    branch 'sandbox-feature'
                    branch 'sandbox-staging'
                    branch 'staging'
                    branch 'main'
                }
            }
            parallel {
                stage('Backend: Test & Scan') {
                    agent {
                        docker {
                            image 'maven:3.9-eclipse-temurin-21-alpine'
                            reuseNode true
                            args '-e HOME=/tmp'
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
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                            args '-e HOME=/tmp'
                        }
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
                anyOf { 
                    // changeRequest(); 
                    branch 'sandbox-staging';
                    branch 'sandbox-feature';
                    branch 'staging'; 
                    branch 'main' 
                }
            }
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                    args '-e HOME=/tmp'
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
                    // changeRequest(); 
                    branch 'sandbox-staging';
                    branch 'sandbox-feature';
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
        // CD: STAGING DEPLOYMENT (EC2 + Docker Compose)
        // ===================================================================================
        stage('CD STAGING: Build & Push Images') {
            when { 
                anyOf { 
                    branch 'sandbox-staging'; 
                    branch 'staging' 
                } 
            }
            parallel {
                stage('Build Backend') {
                    steps {
                        sh "docker build -t ${BACKEND_IMAGE}:staging -t ${BACKEND_IMAGE}:${GIT_SHA} ./backend"
                        withCredentials([usernamePassword(credentialsId: 'DOCKERHUB_CREDS', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                            sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                            sh "docker push ${BACKEND_IMAGE}:staging"
                            sh "docker push ${BACKEND_IMAGE}:${GIT_SHA}"
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        withCredentials([
                            string(credentialsId: 'STAGING_VITE_API_URL', variable: 'VITE_API'),
                            string(credentialsId: 'STAGING_VITE_ROOT_DOMAIN', variable: 'VITE_ROOT')
                        ]) {
                            sh "docker build --build-arg VITE_API_BASE_URL=${VITE_API} --build-arg VITE_ROOT_DOMAIN=${VITE_ROOT} -t ${FRONTEND_IMAGE}:staging -t ${FRONTEND_IMAGE}:${GIT_SHA} ./frontend"
                        }
                        withCredentials([usernamePassword(credentialsId: 'DOCKERHUB_CREDS', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                            sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                            sh "docker push ${FRONTEND_IMAGE}:staging"
                            sh "docker push ${FRONTEND_IMAGE}:${GIT_SHA}"
                        }
                    }
                }
            }
        }

        stage('CD STAGING: Deploy to EC2') {
            when { 
                anyOf { 
                    branch 'sandbox-staging'; 
                    branch 'staging' 
                } 
            }
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'STAGING_SSH_KEY', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'STAGING_IP', variable: 'SERVER_IP'),
                    file(credentialsId: 'STAGING_ENV_FILE', variable: 'ENV_FILE'),
                    usernamePassword(credentialsId: 'DOCKERHUB_CREDS', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')
                ]) {
                    sh "ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@\$SERVER_IP 'sudo mkdir -p /opt/trim-staging && sudo chown -R \$SSH_USER:\$SSH_USER /opt/trim-staging && sudo chmod -R 775 /opt/trim-staging'"
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no \$ENV_FILE \$SSH_USER@\$SERVER_IP:/opt/trim-staging/.env"
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no docker-compose.staging.yml \$SSH_USER@\$SERVER_IP:/opt/trim-staging/docker-compose.yml"
                    sh '''
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << EOF
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
cd /opt/trim-staging
docker compose pull
docker compose up -d --build
EOF
                    '''
                }
            }
        }

        // ===================================================================================
        // CD: PRODUCTION DEPLOYMENT (AWS ECS Fargate + S3 + CloudFront)
        // ===================================================================================
        
        stage('CD PROD: Build Backend & Push to ECR') {
            when { branch 'main' }
            agent {
                docker { 
                    image 'amazon/aws-cli:latest' // Use the official AWS CLI container
                    reuseNode true 
                    args '-e HOME=/tmp'
                }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    echo "Logging into AWS ECR..."
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                    
                    echo "Building and Pushing Backend Image to ECR..."
                    // Note: We use the local Docker engine on the Jenkins machine to build
                    sh "docker build -t ${PROD_BACKEND_IMAGE}:latest -t ${PROD_BACKEND_IMAGE}:${GIT_SHA} ./backend"
                    sh "docker push ${PROD_BACKEND_IMAGE}:latest"
                    sh "docker push ${PROD_BACKEND_IMAGE}:${GIT_SHA}"
                }
            }
        }

        stage('CD PROD: Build Static Frontend') {
            when { branch 'main' }
            agent {
                docker { 
                    image 'node:20-alpine'
                    reuseNode true 
                    args '-e HOME=/tmp'
                }
            }
            steps {
                echo "Building Production React App..."
                dir('frontend') { // Make sure this matches your folder name (e.g., frontend-app)
                    withCredentials([
                        string(credentialsId: 'PROD_VITE_API_URL', variable: 'VITE_API'),
                        string(credentialsId: 'PROD_VITE_ROOT_DOMAIN', variable: 'VITE_ROOT')
                    ]) {
                        sh 'npm ci'
                        // Bake the real AWS domains into the production HTML/JS!
                        sh 'VITE_API_BASE_URL=${VITE_API} VITE_ROOT_DOMAIN=${VITE_ROOT} npm run build'
                    }
                }
            }
        }

        stage('CD PROD: Deploy to AWS') {
            when { branch 'main' }
            agent {
                docker { 
                    image 'amazon/aws-cli:latest' // Use the official AWS CLI container
                    reuseNode true 
                    args '-e HOME=/tmp'
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
                    // Sync the built code to BOTH buckets
                    sh "aws s3 sync frontend/dist s3://trim-app-spa-prod --delete --region ${AWS_REGION}"
                    sh "aws s3 sync frontend/dist s3://trim-marketing-web-prod --delete --region ${AWS_REGION}"

                    echo "Invalidating CloudFront Caches..."
                    sh "aws cloudfront create-invalidation --distribution-id \${SPA_DIST_ID} --paths '/*'"
                    sh "aws cloudfront create-invalidation --distribution-id \${MARKETING_DIST_ID} --paths '/*'"

                    echo "Deploying Backend to ECS Fargate (Zero-Downtime Update)..."
                    // Tell AWS to kill the old container and start the new one
                    sh "aws ecs update-service --cluster trim-prod-cluster --service trim-prod-service --force-new-deployment --region ${AWS_REGION}"
                }
            }
        }
    }

    post {
        always {
            sh "docker system prune -f"
        }
        success {
            echo "Pipeline Success!"
        }
        failure {
            echo "Pipeline Failed! Please check the logs."
        }
    }
}