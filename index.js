import { remote } from 'webdriverio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let movieName = '';
process.argv.forEach((arg) => {
	if (arg.startsWith('--movieName=')) {
		movieName = arg.split('=')[1];
	}
});

if (movieName === '') {
	console.error('Please provide a movie name using the --movieName argument.');
	process.exit(1);
}


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const browser = await remote({
	capabilities: {
		browserName: 'chrome',
		'goog:chromeOptions': {
			args: process.env.CI ? ['headless', 'disable-gpu'] : [],
			prefs: {
				"download.default_directory": __dirname
			}
		}
	}
});

await browser.url('https://einthusan.tv/login/?lang=tamil');
await browser.setTimeout({ implicit: 10000 });
try {
	await browser.$('.qc-cmp2-summary-buttons').waitForDisplayed({ timeout: 5000 });
	await browser.$('.qc-cmp2-summary-buttons').$('//button/span[text()="AGREE"]').click();

	await sleep(2000); // Wait for the consent banner to disappear
}
catch (e) {
	console.log('Consent banner not found, continue');
}

await browser.$('#login-email').setValue('dhaneshkumar_1986@yahoo.co.in');
await sleep(1000); // Wait for the input to be set
await browser.$('#login-password').setValue('navinkumar');
await sleep(1000); // Wait for the input to be set
await browser.$('#login-submit').click();

await browser.$("//div[@id='search']/input").waitForDisplayed({ timeout: 5000 });
await browser.$("//div[@id='search']/input").setValue(movieName);
await sleep(1000); // Wait for the input to be set
await browser.$("//div[@id='search']/input").keys('Enter');
await sleep(1000); // Wait for the input to be set

await browser.$(`//section[@id='UIMovieSummary']/ul/li/div[@class='block2']/a/h3[text()='${movieName}']`).waitForDisplayed({ timeout: 5000 });
await browser.$(`//section[@id='UIMovieSummary']/ul/li/div[@class='block2']/a/h3[text()='${movieName}']`).click();

try {
	await browser.$("//span[text()='superior quality']").waitForDisplayed({ timeout: 5000 });
	await browser.$("//span[text()='superior quality']").click();
	await sleep(3000);
}
catch (e) {
	console.log('Superior quality option not found, continue');
}

let videoUrl = await browser.$("//span[text()='download now']//ancestor::a").getAttribute('href');
if (!videoUrl) {
	console.error('Video URL not found. Please check the movie name or the website structure.');
	await browser.deleteSession();
	process.exit(1);
}

console.log(`Video URL: ${videoUrl}`);
await browser.downloadFile(videoUrl, {
	directory: __dirname,
	filename: `${movieName}.mp4`
});
console.log(`Movie downloaded as ${movieName}.mp4`);
await browser.deleteSession();
process.exit(0);