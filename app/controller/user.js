'use strict';

function filterData (data, year, month) {
  let filterData = []
  for (let i = 0; i < data.length; i++) {
    let dateArr = data[i].date.split('-')
    if (dateArr[0] === year) {
      if (dateArr[1] === month) {
        filterData.push(data[i])
      }
    }
  }
  return filterData
}

function sortByfield (field) {
  return function (a, b) {
    return b[field] - a[field]
  }
}

const Controller = require('egg').Controller;

class UserController extends Controller {

  async login() {
    const ctx = this.ctx;
    const login = ctx.request.body;
    const dbinfo = await this.app.mysql.get('user', {username:login.username});
    console.log(dbinfo)
    if(!dbinfo) {
      this.ctx.response.body = {
        tips: '该用户不存在',
        showTips: true,
        state: -1
      }
    } else if (dbinfo.username === login.username && dbinfo.password !== login.password) {
      this.ctx.response.body = {
        tips: '密码错误，请重新输入',
        showTips: true,
        state: 0
      }
    } else if (dbinfo.username === login.username && dbinfo.password === login.password){
      // console.log(dbinfo)
      this.ctx.response.body = {
        tips: '登录成功,即将跳转',
        showTips: true,
        state: 1
      };
    }else {
      this.ctx.body = '我们检测不到错误，请联系开发者'
    }
    // ctx.response.body = login;
    // ctx.body = login;
    
    // this.ctx.response.body = {
    //   success: true,
    //   message: "发生不知名错误，导致删除失败",
    //   content: '',
    // };
    console.log('用户登录请求 over')
  }

  async info() {
    const ctx = this.ctx;
    const userId = ctx.params.id;
    const user = await this.app.mysql.get('user', { uid: userId });//查询 /user/finduser/:id
    ctx.body = user;
  }

  async useradd() {
    const ctx = this.ctx;
    const userinfo = ctx.request.body;
    const user = await this.app.mysql.get('user', { username:userinfo.username })
    if (user) {
      ctx.body = {
        msg: '该用户已存在',
        code: 0
      }
    } else {
      const result = await this.app.mysql.insert('user', userinfo);
      ctx.body = {
        msg: '注册成功，即将跳转登录',
        code: 1
      }
      console.log('用户注册请求完成')
    }
  }
  
  async finduser(username) {
    const redata = this.ctx.request.body.username
    console.log(redata)
    const user = await this.app.mysql.get('user', {username: redata})
    if (user) {
      user.state = 1
      user.msg = '成功查找到该用户'
      this.ctx.body = user
    } else {
      const result = {}
      result.state = 0
      result.msg = '该用户不存在'
      this.ctx.body = result
    }
    console.log(user, '登录前校验用户名密码')
  }

  async submitrecord() {
    const ctx = this.ctx
    const billdata = ctx.request.bady
    // console.log(ctx.request.body)
    // ctx.request.body.uid = 4
    // console.log(ctx.request.body)
    // console.log(billdata)
    await this.app.mysql.insert('bill', ctx.request.body)
    // console.log('数据成功写入数据库')
    ctx.body = '数据成功写入数据库'
  }

  async getlist() {
    const body = this.ctx.request.body
    const uname = body.username
    // const result = await this.app.mysql.get('bill', {username: ctx.request.body.username})
    const result = await this.app.mysql.select('bill', {
      where: {username: uname},
      orders: [['date', 'desc']]
    })
    const querytitle = await this.app.mysql.select('iconlist')
    // console.log(querytitle)
    for (var i = 0, len = result.length; i < len; i++) {
      for(var j = 0, length = querytitle.length; j < length; j++){
        if (result[i].icontype === querytitle[j].name) {
          result[i].title = querytitle[j].title
        }
      }
    }
    this.ctx.body = result
    // console.log(result, 'getlist调用后打印')
  }

  async getEchartData() {
    const body = this.ctx.request.body
    const uname = body.username
    const year = body.year
    const month = body.month
    const type = body.type
    const queryresult = await this.app.mysql.select('bill', {
      where: {username: uname},
      orders: [['date', 'desc']]
    })
    const result = filterData(queryresult, year, month)
    // console.log(result, '排序之后的钱')
    var totaldata = []
    var state = ''
    var totalmoney = 0
    for (var i = 0; i < result.length; i++) {
      state = totaldata.some(function(item) {
        if (item.name === result[i].icontype) {
          return true;
        }
      })
      if (!state) {
        totaldata.push({
          name: result[i].icontype,
          value: parseFloat(result[i].money),
          type: result[i].type,
          count: 1,
          icontype: result[i].icontype
        })
      } else {
        // console.log('testtest11111')
        // index = totaldata.findIndex(item => {
        //   item.name === result[i].icontype
        // })
        // console.log(index)
        // totaldata[index].value += c
        for (var j = 0; j < totaldata.length; j ++) {
          if (totaldata[j].name === result[i].icontype) {
            totaldata[j].count += 1
            totaldata[j].value = parseFloat(totaldata[j].value) + parseFloat(result[i].money)
          }
        }
      }
    }
    var filtertype = totaldata.filter(item => {
      if(item.type === type) {
        return item
      }
    })
    // console.log(filtertype)
    for (var i = 0, len = filtertype.length; i < len; i++) {
      // totalmoney = parseFloat(totalmoney) + parseFloat(filtertype[i].value)
      totalmoney += filtertype[i].value
      // console.log(totalmoney, '总的钱')
    }
    // console.log(totalmoney, '总的钱')
    const querytitle = await this.app.mysql.select('iconlist')
    // console.log(querytitle)
    for (var i = 0, len = filtertype.length; i < len; i++) {
      const p = Math.floor(filtertype[i].value / totalmoney * 100)
      if (p <= 1) {
        filtertype[i].percent = 1
      } else {
        filtertype[i].percent = p
      }
      for(var j = 0, length = querytitle.length; j < length; j++){
        if (filtertype[i].name === querytitle[j].name) {
          filtertype[i].name = querytitle[j].title
        }
      }
    }
    this.ctx.body = filtertype.sort(sortByfield('value'))
    // [{"itemid":29,"username":"user","type":"支出","money":"12345","date":"2019-5-18","icontype":"money"},
    // {"itemid":24,"username":"user","type":"支出","money":"123","date":"2019-4-19","icontype":"traffic"},
    // {"itemid":25,"username":"user","type":"支出","money":"5465","date":"2019-4-18","icontype":"tongxun"},
    // {"itemid":19,"username":"user","type":"支出","money":"122","date":"2019-4-17","icontype":"specialMoney"},
    // {"itemid":21,"username":"user","type":"支出","money":"1555","date":"2019-4-17","icontype":"travel"},
    // {"itemid":26,"username":"user","type":"支出","money":"234","date":"2019-4-17","icontype":"medical"},
    // {"itemid":27,"username":"user","type":"支出","money":"45","date":"2019-4-17","icontype":"tongxun"},
    // {"itemid":28,"username":"user","type":"支出","money":"9999","date":"2019-4-17","icontype":"beauty"},
    // {"itemid":18,"username":"user","type":"支出","money":"212","date":"2019-4-16","icontype":"pay"},
    // {"itemid":20,"username":"user","type":"支出","money":"585","date":"2019-4-16","icontype":"medical"},
    // {"itemid":22,"username":"user","type":"收入","money":"1211","date":"2019-4-16","icontype":"getmoney"},
    // {"itemid":23,"username":"user","type":"支出","money":"123","date":"2019-4-16","icontype":"travel"}]
    // [{"name":"money","value":47,"type":"支出","count":1},
    // {"name":"traffic","value":123,"type":"支出","count":1},
    // {"name":"tongxun","value":5510,"type":"支出","count":2},
    // {"name":"specialMoney","value":122,"type":"支出","count":1},
    // {"name":"travel","value":1678,"type":"支出","count":2},
    // {"name":"medical","value":819,"type":"支出","count":2},
    // {"name":"beauty","value":9999,"type":"支出","count":1},
    // {"name":"pay","value":212,"type":"支出","count":1},
    // {"name":"getmoney","value":1211,"type":"收入","count":1}]
    // [{"name":"money","value":47,"type":"支出","count":1},
    // {"name":"traffic","value":123,"type":"支出","count":1},
    // {"name":"tongxun","value":5510,"type":"支出","count":2},
    // {"name":"specialMoney","value":122,"type":"支出","count":1},
    // {"name":"travel","value":1678,"type":"支出","count":2},
    // {"name":"medical","value":819,"type":"支出","count":2},
    // {"name":"beauty","value":9999,"type":"支出","count":1},
    // {"name":"pay","value":212,"type":"支出","count":1}]
  }

  async addicon() {
    const body = this.ctx.request.body
    for (var i = 0; i < body.length; i++) {
      this.app.mysql.insert('iconlist', body[i])
    }
    this.ctx.body = 'icon成功写入数据库'
    // console.log(body, 'addicon调用后打印的数据')
    // await this.app.mysql.insert('iconlist', )
  }

  async geticon() {
    const body = this.ctx.request.body
    const icontype = body.icontype
    const iconlist = await this.app.mysql.select('iconlist', {
      where: {icontype: icontype}
    })
    // console.log(iconlist, '根据icontype获取到的icon')
    this.ctx.body = iconlist
  }

  async updateItem() {
    const body = this.ctx.request.body
    const itemid = body.itemid
    const row = {
      username: body.username,
      type: body.type,
      money: body.money,
      date: body.date,
      icontype: body.icontype,
      tip: body.tip
    }
    const options = {
      where: {
        itemid: itemid
      }
    }
    const item = await this.app.mysql.update('bill', row, options)
    console.log(body)
    console.log('come in ')
    this.ctx.body = '数据成功修改'
  }

}
module.exports = UserController;