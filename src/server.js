import * as http from 'http'

import bodyParser from './body-parser'
import cors       from './cors'
import Request    from './request'
import Response   from './response'
import Router     from './router'

import AccountRouter     from './routes/Account'
import AdvertiseRouter   from './routes/Advertise'
import ArticlePageRouter from './routes/ArticlePage'
import ArticleRouter     from './routes/Article'
import CommentRouter     from './routes/Comment'
import FileRouter        from './routes/File'
import FriendRouter      from './routes/Friend'
import GroupRouter       from './routes/Group'

const router = new Router()

const corsConfig = {
    origin: '*',
    credentials: true
}

router.use(bodyParser)
router.use(cors(corsConfig))

router.use('/account',                       AccountRouter)
router.use('/advertise',                     AdvertiseRouter)
router.use('/article/page/:page/size/:size', ArticlePageRouter)
router.use('/article',                       ArticleRouter)
router.use('/comment',                       CommentRouter)
router.use('/file',                          FileRouter)
router.use('/friend',                        FriendRouter)
router.use('/group',                         GroupRouter)

const server = http.createServer(async (req, res) => {
    const request  = new Request(req)
    const response = new Response(res)
    try {
        if (!(await router.Match(request, response))) {
            response.status(404).json({error: 'path not found'})
        }
    } catch (e) {
        response.status(404).json({error: 'undefined error'})
    }
})

server.listen(3000)
server.on('listening', () => {
    console.log('Node.js web server at localhost:3000 is running...')
})