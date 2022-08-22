const http = require("http");
const axios = require("axios");
const _ = require('lodash/object')
// 引入演示的环境变量 - 必须
require('dotenv').config({ path: '.env.example', debug: true })
// 引入开发的环境变量 - 可有可无
require('dotenv').config({ path: '.env.local', override: true })

const URL = process.env.URL
const TOKEN = process.env.TOKEN
const ADMIN_QQ = process.env.ADMIN_QQ
const BOT_QQ = process.env.BOT_QQ

function main () {
  const server = http.createServer((req, res) => {
    let rawData = ''

    req.on('data', (chunk) => { rawData += chunk })
    req.on('end', async () => {
      try {
        const data = JSON.parse(rawData);
        res.end('success')
        handleMsg(data);
      } catch (e) {
        res.end('Unauthorized error')
        console.error(e.message);
      }
    })
  });

  // 8888是你设置的回调函数的端口，可以自行修改
  server.listen(8888);
}

// 处理接收到的 MQ 对象
function handleMsg (mqObj) {
  console.log("-----MQ消息对象，具体可启动应用查看-----\n", mqObj);

  const qqMsg = decodeURIComponent(mqObj["MQ_msg"]).replace(/\+/g, ' ')
  Object.assign(mqObj, { "MQ_msg": qqMsg })
  console.log("----接收到的QQ消息-----\n", qqMsg);

  const matchMsg = match(mqObj, matchOptions)

  if (matchMsg) {
    const variableSendOptions = {
      params: {
        c4: ADMIN_QQ,
        c5: `监听到关键词：${matchMsg.keyWord}\n----------\n${qqMsg}`
      }
    }
    const data = _.merge({}, defaultSendOptions, variableSendOptions)
    sendMsg(data);
  }
}


function sendMsg (params) {
  axios
    .post(URL, params)
    .then((res) => {
      // 发送成功返回的数据
      console.log(res.data);
    })
    .catch((err) => {
      // 发送失败返回的数据
      console.log(err);
    });
}

// 设置默认发送参数
const defaultSendOptions = {
  function: "Api_SendMsg", // MyQQ api 函数名称
  token: TOKEN,            // 后台 HTTPAPI 插件设置的 token
  params: {
    c1: BOT_QQ,             //参数1，要使用的机器人QQ
    c2: 1,                  //参数2，消息类型，2为群，以此类推...
    c3: '',                 //参数3，要发送的群号，此处发的是群，所以这个要留空，以此类推..
    c4: '',                 //参数4，要发送的QQ，以此类推...
    c5: "Hello world！",    //参数5，要发送的消息内容，以此类推...
  }
}

// 设置条件匹配 每个属性值必须用数组
const matchOptions = {
  MQ_fromID: ['708028541'],
  MQ_type: [1, 2],
  MQ_msg: ['你好', '硬盘', '固态', '话费', '神车']
}

// 为传入的源对象和条件进行匹配判断，没有设置条件则返回 true，源对象里有一个属性与条件匹配不上则返回 false，其他属性都匹配，消息属性与条件里有一条匹配上则返回 匹配到的数据
function match (object, options) {
  if (!options) return true

  // 匹配的消息
  let matchMsg

  for (const key in options) {
    if (Object.hasOwnProperty.call(options, key)) {
      const element = options[key];
      if (key !== 'MQ_msg') {
        if (!element.includes(object[key])) return false
      } else {
        // 满足其一算法
        element.find(v => {
          const reg = new RegExp(v, 'im')
          matchMsg = matchMsg || object[key].match(reg)
          matchMsg && (matchMsg.keyWord = matchMsg.keyWord || v)
        })
        // 满足所有算法 Code...
      }
    }
  }

  return matchMsg
}

function formatMsg (params) {

}

function formatGuid (params) {

}

main();
