FROM php:8.2-apache

# 시스템 패키지 업데이트 및 필요한 도구 설치
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

# 필요한 PHP 확장 설치
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Apache 모듈 활성화
RUN a2enmod rewrite
RUN a2enmod headers

# PHP 설정 (파일 업로드)
RUN echo "file_uploads = On" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "upload_max_filesize = 10M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 10M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini

# Composer 설치
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 작업 디렉토리 설정
WORKDIR /var/www/html

# Apache 설정
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# 파일 권한 설정
RUN chown -R www-data:www-data /var/www/html