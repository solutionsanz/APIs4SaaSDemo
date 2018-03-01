
if [ $1 = 'full' ] 
	then

		echo "Removing current working directory"

		rm -rf /home/vagrant/cri/TheCastle-Dev/APIs4SaaSDemo/vagrant

	else
		echo "Removing current working directory except for node-modules"

		cd /home/vagrant/cri/TheCastle-Dev/APIs4SaaSDemo/vagrant && rm -rf $(ls -1 --ignore=node_modules /home/vagrant/cri/TheCastle-Dev/APIs4SaaSDemo/vagrant/)		

fi


echo "Copying new working directory with the latest source code"

cd /vagrant && mkdir -p /home/vagrant/cri/TheCastle-Dev/APIs4SaaSDemo/vagrant && cp -r $(ls -1 --ignore=.* /vagrant) /home/vagrant/cri/TheCastle-Dev/APIs4SaaSDemo/vagrant

cd /home/vagrant/cri/TheCastle-Dev/APIs4SaaSDemo/vagrant


if [ $1 = 'full' ]
	then
		echo "Installing Node dependencies"
		npm install
fi


echo "Seting up environment variables"
. /vagrant/setEnv.sh
echo "Running NodeJS App"
node app
