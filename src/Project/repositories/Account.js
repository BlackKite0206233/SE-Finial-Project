import Model from '../models/MongoDB'

import RedisService from '../services/Redis'

import utils from '../Utils'

export default class Account {
    constructor() {
        this.AccountModel = new Model('account')
        this.RedisService = new RedisService()
    }

    async getAllAccounts() {
        return await this.AccountModel.select('*').query()
    }

    async getAccountByToken(token) {
        const ID = await this.RedisService.Verify(token)
        return await this.getAccountByID(ID)
    }

    async getAccountByID(id) {
        return (await this.AccountModel.select('*').where('id', id).query())[0]
    }

    async getAccountByAccount(account) {
        return (await this.AccountModel.select('*').where('account', account).query())[0]
    }

    async getAccountsByName(name) {
        return await this.AccountModel.select('*').where('name', 'like', name).query()
    }

    async create(data) {
        if(!utils.allow(data, ['account', 'password', 'name'])) {
            throw 'not accept'
        }
        console.log(123)
        await this.AccountModel.insert(data)
    }

    async edit(id, data) {
        if(!utils.allow(data, ['account', 'password', 'name', 'department', 'class', 'birthday', 'sex', 'ID_card', 'address', 'photo', 'passport', 'credit_card', 'cvc', 'expire_date', 'NTUST_coin', 'interst'])) {
            throw 'not accept'
        }
        this.AccountModel.where('id', id).update(data)
    }

    async Delete(id) {
        await this.AccountModel.where('id', id).del()
    }
}