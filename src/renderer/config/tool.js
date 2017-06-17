/**
 * Created by Deboy on 2017/5/12.
 */
const defaultRow = require('./default-row').default
import _ from 'lodash'
/**
 * 根据类型 来合并某个字段 并返回合并后的字段列表
 * @param type
 * @param rows
 * @returns {Array}
 */
export const mergeDefaultRow = (type = 'laravel', rows) => {
  if (typeof rows === 'array') {
    let list = []
    rows.forEach((row) => {
      // fix 2017-5-16 bug
      if (type === 'springboot') {
        delete row.laravel
      }
      list.push(_.merge({}, defaultRow[type], row))
    })
    return list
  } else {
    // fix 2017-5-16 bug
    if (type === 'springboot') {
      delete rows.laravel
    }
    return _.merge({}, defaultRow[type], rows)
  }
}

/**
 * 获取指定类型的的 字段配置
 * @param type
 * @returns {*}
 */
export const getDefaultRow = (type = 'laravel') => {
  return defaultRow[type]
}

// 将属性的值直接赋给属性 不用多一层属性 减少项目结构
let setValue = (obj = {}) => {
  for (let key in obj) {
    obj[key] = obj[key].value
  }
  return obj
}
// [{key: 'host', value: '127.0.0.1'}] => {host: '127.0.0.1'}
let arrayToObject = (list = []) => {
  let obj = {}
  list.forEach(item => {
    obj[item.key] = item.value
  })
  return obj
}
let splitToArray = (str) => {
  if (!str) {
    return null
  }
  let props = str.split(';')
  let obj = {}
  props.forEach(prop => {
    let propArr = prop.split(':')
    obj[propArr[0]] = propArr[1]
  })
  return obj
}
// 查找关联表并设置one属性
export const setRelProjectInfo = (project) => {
  project.props = arrayToObject(project.props)
  project.tables.forEach(table => {
    // 将项目的属性也插入到表中
    table.projectProps = project.props
    table.props = arrayToObject(table.props)
    table.fields.forEach(field => {
      field.db = setValue(field.db)
      switch (project.type) {
        case 'laravel':
          field.laravel = setValue(field.laravel)
          delete field.java
          break
        case 'springboot':
          field.java = setValue(field.java)
          delete field.laravel
          break
        default:
          field.laravel = setValue(field.laravel)
      }
      field.vue = setValue(field.vue)
      field.filter = splitToArray(field.filter)
      if (field.relTable) {
        project.tables.forEach(tab => {
          if (tab.id === field.relTable) {
            console.log(tab.id, tab.name)
            let newTab = JSON.parse(JSON.stringify(tab))
            delete newTab.one
            delete newTab.relTable
            field.one = newTab.fields
            field.relTable = newTab.name
            return false
          }
        })
      }
    })
  })
  return project
}
