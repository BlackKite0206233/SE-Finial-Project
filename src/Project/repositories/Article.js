import Model from '../models/Model'

import FriendRepo  from './Friend'

import utils from '../Utils'

export default class Article {
    constructor() {
        this.ArticleModel = new Model('article')
        this.CommentModel = new Model('comment')
        this.GroupModel   = new Model('group')
        this.FriendRepo   = new FriendRepo()
    }

    async getAllArticles() {
        return await this.ArticleModel.select('*').query()
    }

    async getDefaultArticles(accountID) {
        const friendList = await this.FriendRepo.getAllFriends(accountID)
        const author = friendList.map(friend => friend.id)
        author.push(accountID)
        return await this.ArticleModel.select('*').whereIn('author', author).andWhere('board_id', '').query()
    }

    async getRecommandArticles() {
        if (this.ArticleModel.db === 'mongo') {
            let groups   = await this.GroupModel.select('id').where('type', 'Board').query()
            groups       = groups.map(group => group.id)
            let articles = await this.ArticleModel.raw([
                { $lookup: { from: 'comment', localField: 'id', foreignField: 'article_id', as: 'comment' } },
                { $unwind: { path: '$comment', preserveNullAndEmptyArrays: true } },
                { $project: {'id': 1, 'board_id': 1, 'types': '$comment.types' } },
                { $match: { $or: [ 
                            { 
                                $or: [{ types: { $in: [0, 1] } }, { types: { $exists: false } }],
                                board_id: ''
                            },
                            { board_id: { $in: groups } }, 
                        ]
                    }
                },
                { $group: { _id: '$id', id: { $first: '$id' }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
            articles = articles.map(article => article.id)
            return await this.ArticleModel.whereIn('id', articles).query()
        } else {
            return await this.ArticleModel.raw('select `article`.* from `article`                                      \
                                                left join `comment` on                                                 \
                                                    `article`.`id` = `comment`.`article_id` and                        \
                                                    `comment`.`types` in (0, 1) and (                                  \
                                                        `article`.`board_id` = \'\' or `article`.`board_id` in (       \
                                                            select `id` from `groups` where `type` = \'Board\'         \
                                                        )                                                              \
                                                    )                                                                  \
                                                group by `article`.`id`                                                \
                                                order by count(`comment`.`types`) desc                                 \
                                                limit 10')
        }
    }

    async getArticleByID(id) {
        return (await this.ArticleModel.select('*').where('id', id).query())[0]
    }

    async getArticleByAuthor(author) {
        return await this.ArticleModel.select('*').where('author', author).andWhere('board_id', '').query()
    }

    async getArticleByTitle(title) {
        return await this.ArticleModel.select('*').where('title', 'like', title).andWhere('board_id', '').query()
    }

    async getArticleByContext(context) {
        return await this.ArticleModel.select('*').where('context', 'like', context).andWhere('board_id', '').query()
    }
    
    async getArticleByGroup(group) {
        return await this.ArticleModel.select('*').where('board_id', group).query()
    }

    async getArticleByGroupAndAuthor(group, author) {
        return await this.ArticleModel.select('*').where('author', author).andWhere('board_id', group).query()
    }

    async getArticleByGroupAndTitle(group, title) {
        return await this.ArticleModel.select('*').where('title', 'like', title).andWhere('board_id', group).query()
    }

    async getArticleByGroupAndContext(group, context) {
        return await this.ArticleModel.select('*').where('context', 'like', context).andWhere('board_id', group).query()   
    }

    async create(data) {
        await this.ArticleModel.insert(data)
    }

    async edit(id, data) {
        const promise = []
        if (data.image && data.image.length > 2) {
            const article = await this.getArticleByID(id)
            if (article.image) {
                let images
                try {
                    images = JSON.parse(article.image)
                } catch (e) {
                    throw 'parse json error'
                }
                for (const image of images) {
                    promise.push(utils.removeFile(utils.getPath('uploadedFiles', image)))
                }
            }
        }
        promise.push(this.ArticleModel.where('id', id).update(data))
        await Promise.all(promise)
    }

    async deletebyGroup(group_id) {
        const promise  = []
        let   articles = await this.ArticleModel.select('id').where('group', group_id).query()
        
        for (const article of articles) {
            if (article.image && article.image.length > 2) {
                let images
                try {
                    images = JSON.parse(article.image)
                } catch (e) {
                    throw 'parse json error'
                }
                for (const image of images) {
                    promise.push(utils.removeFile(utils.getPath('uploadedFiles', image)))
                }
            }
        }
        articles = articles.map(article => article.id)
        promise.push(this.ArticleModel.where('board_id', group_id).del())
        promise.push(this.CommentModel.whereIn('article_id', articles).del())
        await Promise.all(promise)
    }

    async delete(id) {
        const promise = []
        const article = await this.getArticleByID(id)
        if (article.image && article.image.length > 2) {
            let images
            try {
                images = JSON.parse(article.image)
            } catch (e) {
                throw 'parse json error'
            }
            for (const image of images) {
                promise.push(utils.removeFile(utils.getPath('uploadedFiles', image)))
            }
        }
        promise.push(this.ArticleModel.where('id', id).del())
        promise.push(this.CommentModel.where('article_id', id).del())
        await Promise.all(promise)
    }
}