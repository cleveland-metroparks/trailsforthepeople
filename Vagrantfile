Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/precise64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.hostname = "trailsvagrant.clevelandmetroparks.com"
  #config.vm.synced_folder ".", "/vagrant", disabled: true
  #config.vm.synced_folder ".", "/var/www"
  config.vm.provision :puppet
end