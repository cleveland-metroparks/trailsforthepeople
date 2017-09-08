# Run 'apt-get update'
exec { "apt-get update":
  path => "/usr/bin",
}

# Install PHP
package { 'php5':
  require => Exec['apt-get update'],
  ensure => installed,
}

## Install apache2
#package { "apache2":
#  ensure  => present,
#  require => Exec["apt-get update"],
#}

class { 'apache':
  default_vhost => false,

  mpm_module => 'prefork',

  faux_path        => '/var/www/php.fcgi',
  fcgi_alias       => '/php.fcgi',
  file_type        => 'application/x-httpd-php',
  custom_fragment  => 'AddType application/x-httpd-php .php',

  fallbackresource => '/index.php',
}

apache::vhost { 'trailsvagrant.clevelandmetroparks.com non-ssl':
  servername      => 'trailsvagrant.clevelandmetroparks.com',
  serveraliases   => ['trailsvagrant.loco', 'localhost'],
  port            => '8080',
  docroot         => '/var/www',
  redirect_status => 'permanent',
  redirect_dest   => 'https://trailsvagrant.clevelandmetroparks.com/'
}

apache::vhost { 'trailsvagrant.clevelandmetroparks.com ssl':
  servername       => 'trailsvagrant.clevelandmetroparks.com',
  serveraliases    => ['trailsvagrant.loco', 'localhost'],
  port             => '443',
  docroot          => '/var/www',
  ssl              => true,

  #ssl_cert        => '/etc/ssl/fourth.example.com.cert',
  #ssl_key         => '/etc/ssl/fourth.example.com.key',
}

## Start apache2
#service { "apache2":
#  ensure  => "running",
#  require => Package["apache2"],
#}

# Mount project dir as /var/www
file { "/var/www":
  ensure  => "link",
  target  => "/vagrant",
  force  => true,
  require => Package["apache2"],
  notify  => Service["apache2"],
}