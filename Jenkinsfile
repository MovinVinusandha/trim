pipeline {
    agent any

    environment {
        // --- CONFIGURATION ---
        DOCKER_REGISTRY = "movinvinusandha"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/trim-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/trim-frontend"
        
        // Generate a unique tag based on the Git commit hash
        GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {
        stage('Initialize') {
            steps {
                checkout scm
            }
        }

        stage('CI: Code Quality & Testing') {
            // when { changeRequest(target: 'sandbox-staging') }
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
            // when { changeRequest(target: 'sandbox-staging') }
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
            steps {
                echo "Waiting for SonarQube to grade both Backend and Frontend..."
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo "Quality Gate Passed!"
            }
        }

        stage('CD: Build & Push Images') {
            // when { 
            //     branch 'sandbox-staging' 
            // }
            parallel {
                stage('Build Backend') {
                    steps {
                        echo "Building and Pushing Backend Docker Image..."
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
                        echo "Building and Pushing Frontend Docker Image..."
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

        stage('CD: Deploy to EC2') {
            // when { 
            //     branch 'sandbox-staging' 
            // }
            steps {
                echo "Deploying to EC2..."
                
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'STAGING_SSH_KEY', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'STAGING_IP', variable: 'SERVER_IP'),
                    file(credentialsId: 'STAGING_ENV_FILE', variable: 'ENV_FILE'),
                    usernamePassword(credentialsId: 'DOCKERHUB_CREDS', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')
                ]) {
                    // 1. Create directory, aggressively assign ownership to the explicit SSH user, and ensure write permissions
                    sh "ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@\$SERVER_IP 'sudo mkdir -p /opt/trim-staging && sudo chown -R \$SSH_USER:\$SSH_USER /opt/trim-staging && sudo chmod -R 775 /opt/trim-staging'"

                    // 2. Securely copy files
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no \$ENV_FILE \$SSH_USER@\$SERVER_IP:/opt/trim-staging/.env"
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no docker-compose.staging.yml \$SSH_USER@\$SERVER_IP:/opt/trim-staging/docker-compose.yml"

                    // 3. SSH in, LOGIN TO DOCKER, pull fresh images, and restart
                    sh '''
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << EOF
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        cd /opt/trim-staging
                        docker compose pull
                        docker compose up -d
                    EOF
                    '''
                }
            }
        }
    }

    // Clean up local Jenkins server storage after build
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