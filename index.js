const Xray = require('x-ray');
const x = Xray().delay(1000);
const fs = require('fs/promises');
const articleList = require('./articleList.json');

async function scrapeArticle(articleUrl) {
    try {
        const articleNumber = articleUrl.match(/(?<=answer\/)\d+/);
        const res = await x(articleUrl, 'article');
        await fs.writeFile(`./answers/${articleNumber}.txt`, res);
        console.log(`Scraped and saved ${articleUrl}`);
    } catch (err) {
        console.error(`Error scraping ${articleUrl}: ${err}`);
    }
}

async function scrapeAllArticles() {
    let i = 0

    for (const article of articleList) {
        
        await scrapeArticle(article);
        i++
        console.log(i)
    }
}

scrapeAllArticles();