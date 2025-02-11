const { exec } = require('child_process');

function execPromise (command) {
    return new Promise(function(resolve, reject) {
        exec(command, (error, stdout, stderr) => {
			console.log('Error: ', error, stderr);

            if (error || stderr) {
                reject(error || stderr);
                return;
            };

			console.log('Out: ', stdout.trim());

            resolve(stdout.trim());
        });
    });
};

exports.default = async function (context) {
	console.log(context);

	const cmd = [
		`AzureSignTool.exe sign`,
		`-du "${context.site}"`,
		`-fd sha384`,
		`-td sha384`,
		`-tr http://timestamp.digicert.com`,
		`--azure-key-vault-url "${process.env.AZURE_KEY_VAULT_URI}"`,
		`--azure-key-vault-client-id "${process.env.AZURE_CLIENT_ID}"`,
		`--azure-key-vault-tenant-id "${process.env.AZURE_TENANT_ID}"`,
		`--azure-key-vault-client-secret "${process.env.AZURE_CLIENT_SECRET}"`,
		`--azure-key-vault-certificate "${process.env.AZURE_CERT_NAME}"`,
		`-v`,
		`"${context.path}"`,
	].join(' ');

	return await execPromise(cmd);
};