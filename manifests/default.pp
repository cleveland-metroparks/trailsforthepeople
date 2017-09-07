# Run 'apt-get update'
exec { "apt-get update":
  path => "/usr/bin",
}

# Install apache2
package { "apache2":
  ensure  => present,
  require => Exec["apt-get update"],
}

# Start apache2
service { "apache2":
  ensure  => "running",
  require => Package["apache2"],
}

# Install PHP
package { 'php5':
  require => Exec['apt-get update'],
  ensure => installed,
}

# Mount project dir as /var/www
file { "/var/www":
  ensure  => "link",
  target  => "/vagrant",
  force  => true,
  require => Package["apache2"],
  notify  => Service["apache2"],
}