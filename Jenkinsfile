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
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // ===================================================================================
        // FLOW 1: THE PR GATEKEEPER (Runs when a PR is opened against 'staging')
        // ===================================================================================
        stage('PR: Run Unit & Integration Tests for Backend') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-21-alpine'
                    reuseNode true
                    args '-e HOME=/tmp'
                }
            }
            when { 
                changeRequest(target: 'sandbox-staging')
            }
            steps {
                echo "1. Running Backend Tests (JUnit + H2 In-Memory DB)..."
                dir('backend') {
                    sh 'chmod +x mvnw'
                    sh './mvnw clean test'
                }
            }
        }

        stage('PR: Run Unit & Integration Tests for Frontend') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                    args '-e HOME=/tmp'
                }
            }
            when { 
                changeRequest(target: 'sandbox-staging') 
            }
            steps {
                echo "2. Running Frontend Tests (Vitest + JSDOM)..."
                dir('frontend') {
                    sh '''
                        npm ci
                        npm install --no-save @vitest/coverage-v8
                        npx vitest run --coverage.enabled=true --coverage.reporter=lcov --coverage.reportsDirectory=./coverage
                    '''
                }
            }
        }

        // ===================================================================================
        // FLOW 2: SONARQUBE ANALYSIS
        // ===================================================================================  
        stage('SonarQube: Backend') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-21-alpine'
                    reuseNode true
                    args '-e HOME=/tmp'
                }
            }
            when { 
                changeRequest(target: 'sandbox-staging')
            }
            environment {
                SONAR_TOKEN = credentials('SONARQUBE_TOKEN')
                SONAR_HOST_URL = credentials('SONARQUBE_HOST_URL')
            }
            steps {
                dir('backend') {
                    sh '''
                        ./mvnw clean org.jacoco:jacoco-maven-plugin:0.8.12:prepare-agent verify org.jacoco:jacoco-maven-plugin:0.8.12:report org.sonarsource.scanner.maven:sonar-maven-plugin:sonar \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_TOKEN} \
                            -Dsonar.projectKey="trim-backend" \
                            -Dsonar.projectName="Trim Backend" \
                            -Dsonar.userHome="/tmp/.sonar"
                    '''
                }
            }
        }

        stage('SonarQube: Frontend') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                    args '-e HOME=/tmp'
                }
            }
            when { 
                changeRequest(target: 'sandbox-staging')
            }
            environment {
                SONAR_TOKEN = credentials('SONARQUBE_TOKEN')
                SONAR_HOST_URL = credentials('SONARQUBE_HOST_URL')
            }
            steps {
                dir('frontend') {
                    sh '''
                        sonar-scanner \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_TOKEN} \
                            -Dsonar.projectKey="trim-frontend" \
                            -Dsonar.projectName="Trim Frontend" \
                            -Dsonar.sources=src \
                            -Dsonar.tests=src \
                            -Dsonar.test.inclusions="**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/*.spec.ts" \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
                }
            }
        }


        // ===================================================================================
        // FLOW 3: THE DEPLOYMENT (Runs ONLY when code is officially merged into 'staging')
        // ===================================================================================
        stage('Build & Push Staging Images') {
            when { 
                branch 'sandbox-staging'
            }
            steps {
                echo "Code merged to staging! Building Docker Images..."
                
                withCredentials([
                    string(credentialsId: 'STAGING_VITE_API_URL', variable: 'VITE_API'),
                    string(credentialsId: 'STAGING_VITE_ROOT_DOMAIN', variable: 'VITE_ROOT')
                ]) {
                    // Build Frontend with injected Vite variables
                    sh """
                    docker build \
                        --build-arg VITE_API_BASE_URL=${VITE_API} \
                        --build-arg VITE_ROOT_DOMAIN=${VITE_ROOT} \
                        -t ${FRONTEND_IMAGE}:staging -t ${FRONTEND_IMAGE}:${GIT_SHA} ./frontend
                    """
                }

                // Build Backend
                sh "docker build -t ${BACKEND_IMAGE}:staging -t ${BACKEND_IMAGE}:${GIT_SHA} ./backend"

                // Push to Docker Hub
                withCredentials([usernamePassword(credentialsId: 'DOCKERHUB_CREDS', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${FRONTEND_IMAGE}:staging"
                    sh "docker push ${FRONTEND_IMAGE}:${GIT_SHA}"
                    sh "docker push ${BACKEND_IMAGE}:staging"
                    sh "docker push ${BACKEND_IMAGE}:${GIT_SHA}"
                }
            }
        }

        stage('Deploy to AWS EC2 Staging Server') {
            when { 
                branch 'sandbox-staging' 
            }
            steps {
                echo "Deploying to EC2..."
                
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'STAGING_SSH_KEY', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'STAGING_IP', variable: 'SERVER_IP'),
                    file(credentialsId: 'STAGING_ENV_FILE', variable: 'ENV_FILE')
                ]) {
                    // 1. Securely copy the master .env file to the EC2 server
                    sh "scp -i \$SSH_KEY -o StrictHostKeyChecking=no \$ENV_FILE \$SSH_USER@\$SERVER_IP:/opt/trim-staging/.env"

                    // 2. SSH into the server, pull the fresh images, and restart Docker Compose
                    sh """
                    ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@\$SERVER_IP '
                        cd /opt/trim-staging &&
                        docker compose pull &&
                        docker compose up -d --build
                    '
                    """
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

// test line