const express = require('express')
const { generateSlug } = require('random-word-slugs')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
// const { Server } = require('socket.io')
// const Redis = require('ioredis')

const app = express()
const PORT = 1000

// const subscriber = new Redis('')

// const io = new Server({ cors: '*' })

// io.on('connection', socket => {
//     socket.on('subscribe', channel => {
//         socket.join(channel)
//         socket.emit('message', `Joined ${channel}`)
//     })
// })

// io.listen(9002, () => console.log('Socket Server 9002'))

const ecsClient = new ECSClient({
        region: 'ap-southeast-2',
        credentials: {
            accessKeyId: 'AKIATCKATP5R4LPWD2ZB',
            secretAccessKey: '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'
        }
})

const config = {
    CLUSTER: 'builder-cluster',
    TASK: 'builder-task-2'
}

app.use(express.json())

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body
    const projectSlug = slug ? slug : generateSlug()

    // Spin the container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['subnet-01e58b57a81b250e2', 'subnet-05193b14e1005110a', 'subnet-0273bb2d520987952'],
                securityGroups: ['sg-0b3100168f96c9a80']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image-two',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } })

})

// async function initRedisSubscribe() {
//     console.log('Subscribed to logs....')
//     subscriber.psubscribe('logs:*')
//     subscriber.on('pmessage', (pattern, channel, message) => {
//         io.to(channel).emit('message', message)
//     })
// }


// initRedisSubscribe()

app.listen(PORT, () => console.log(`API Server Running..${PORT}`))
//name of your container ie builder-server-2 and the other builder-image-2