import path from 'path'

import compression from 'compression'
import elasticsearch from 'elasticsearch'
import express from 'express'
import graphQLHTTP from 'express-graphql'
import { GraphQLSchema } from 'graphql'
import { MongoClient } from 'mongodb'

import browserConfig from '@browser/config'

import { RootType } from './schema/root'
import renderTemplate from './template'

const requiredSettings = ['ELASTICSEARCH_URL', 'MONGO_URL', 'PORT']
const missingSettings = requiredSettings.filter(setting => !process.env[setting])
if (missingSettings.length) {
  throw Error(`Missing required environment variables: ${missingSettings.join(', ')}`)
}

const app = express()
app.use(compression())

// eslint-disable-line
;(async () => {
  const elastic = new elasticsearch.Client({ host: process.env.ELASTICSEARCH_URL })
  const mongo = await MongoClient.connect(process.env.MONGO_URL)

  const html = await renderTemplate({
    gaTrackingId: process.env.GA_TRACKING_ID,
    title: browserConfig.pageTitle,
  })

  app.use(
    '/api',
    graphQLHTTP({
      schema: new GraphQLSchema({ query: RootType }),
      graphiql: true,
      context: {
        database: {
          gnomad: mongo,
          elastic,
          mongo,
        },
      },
    })
  )

  const publicDir = path.resolve(__dirname, 'public')
  app.use(express.static(publicDir))

  app.get('*', (request, response) => {
    response.send(html)
  })

  app.listen(process.env.PORT, () => {
    console.log(`Listening on ${process.env.PORT}`)
  })
})()
