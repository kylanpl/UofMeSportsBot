import fetch from 'node-fetch';

export async function getSummary(battletag) {

	try {
		const response = await fetch(`https://overfast-api.tekrop.fr/players/${battletag}/summary`);
		const data = await response.json();
		return { data, response };
	}
	catch (error) {
		console.log(`Error: ${error}`);
	}

}

export async function getFullStats(battletag) {
	try {
		const response = await fetch(`https://overfast-api.tekrop.fr/players/${battletag}`);
		const data = await response.json();
		return { data, response };
	}
	catch (error) {
		console.log(`Error: ${error}`);
	}
}

