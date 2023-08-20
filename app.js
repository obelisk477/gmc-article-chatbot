const { OpenAI } = require("langchain/llms/openai")
const { FaissStore } = require("langchain/vectorstores/faiss")
const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
const { loadQAStuffChain, loadQAMapReduceChain } = require("langchain/chains")
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory')
const { TextLoader } = require('langchain/document_loaders/fs/text')
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')

const express = require('express')
const http = require('http')
const { fileURLToPath } = require("url")
const path = require('path')
const { dirname } = require('path')
const dotenv = require('dotenv')
dotenv.config()

// console.log('filename is ' + __filename)

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)
const app = express()
const port = 3000

// http.createServer(app).listen(port)
// console.info('listening on port ' + port)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

app.get('/api/health', async (req, res) => {

    const llmA = new OpenAI({
        openAIApiKey:process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo"
    })
    const chainA = loadQAStuffChain(llmA)
    const directory = './'

    const fields = {
        verbose: true,
        openAIApiKey: process.env.OPENAI_API_KEY
    }

    const loadedVectorStore = await FaissStore.load(
        directory,
        new OpenAIEmbeddings(fields)
    )

    const question = "Would it be a good thing to test running multiple merchant promotions in the google merchant center at one time, even if there is overlap between items?"
    
    
    const result = await loadedVectorStore.similaritySearch(question, 1)

    let sourceLink = 'https://support.google.com/merchants/answer/'+result[0].metadata.source.match(/\d+(?=\.txt)/)[0]

    const resA = await chainA.call({
        input_documents: result,
        question
    })

    res.json({
        result: resA,
        source: sourceLink
    })


})

const injest_docs = async() => {
    const loader = new DirectoryLoader('./answers', { ".txt": (path) => new TextLoader(path)})
    const docs = await loader.load()
    console.log('docs loaded')

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    })

    const docOutput = await textSplitter.splitDocuments(docs)

    const fields = {
        verbose: true,
        openAIApiKey: process.env.OPENAI_API_KEY
    }

    let vectorStore = await FaissStore.fromDocuments(
        docOutput,
        new OpenAIEmbeddings(fields)
    )
    console.log('saving...')

    const directory = './'
    await vectorStore.save(directory)
    console.log('saved!')
}

