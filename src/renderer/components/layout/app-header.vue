<template>
    <div class="header">
        <Button type="primary" @click="showModal = true">新增项目</Button>
        <Button type="primary" @click="showImportFromSQLModal = true">从SQL导入</Button>
        <Button type="error" v-show="projectIndex!==null && projectIndex!==''" @click="showDeleteConfirm = true">
            删除当前项目
        </Button>
        <router-link tag="span" :to="{name: 'ExportPage'}">
            <Button type="primary">导出配置</Button>
        </router-link>
        <!--马上同步到本地文件-->
        <div @click="$project.syncToLocalFile($store.getters.projectList, $store.dispatch('showNotice', {type: 'success', title: '保存成功', desc: '项目已同步到本地文件中!'}))"
             class="save-to-local-btn">
            <Tooltip content="马上同步到本地文件中">
                <Icon type="ios-cloud-download" size="35"></Icon>
            </Tooltip>
        </div>
        <!--马上同步本地目录-->
        <div @click="$project.syncProject()" class="sync-btn">
            <Tooltip content="从本地文件同步到软件中">
                <Icon type="ios-cloud-upload" size="35"></Icon>
            </Tooltip>
        </div>
        <router-link tag="div" :to="{name: 'Settings'}">
            <div class="config-btn">
                <Icon type="gear-b" size="35"></Icon>
            </div>
        </router-link>
        <!--新增项目-->
        <Modal v-model="showModal" title="请输入项目名称" @on-ok="confirmAdd" @on-cancel="()=>{showModal = false}">
            <Form ref="formInline" :model="project" :rules="projectRule">
                <Form-item prop="name" label="项目名称">
                    <Input type="text" v-model="project.name" placeholder="请输入项目名称">
                    </Input>
                </Form-item>
                <FormItem prop="type" label="项目类型">
                    <Select v-model="project.type" placeholder="请选择项目类型" style="width: 100%">
                        <template v-for="type in projectTypes">
                            <Option :value="type">{{type}}</Option>
                        </template>
                    </Select>
                </FormItem>
            </Form>
        </Modal>
        <!--从数据库中导入项目-->
        <Modal v-model="showImportFromSQLModal" title="请输入项目名称" @on-ok="confirmAdd"
               @on-cancel="()=>{showImportFromSQLModal = false}">
            <Form ref="formInline" :model="database" :rules="databaseRule">
                <Form-item prop="address" label="IP地址">
                    <Input type="text" v-model="database.address" placeholder="请输入数据库链接IP地址">
                    </Input>
                </Form-item>
                <Form-item prop="port" label="端口">
                    <Input type="text" v-model="database.port" placeholder="请输入数据库链接端口">
                    </Input>
                </Form-item>
                <Form-item prop="name" label="数据库名">
                    <Input type="text" v-model="database.name" placeholder="请输入数据库链接名">
                    </Input>
                </Form-item>
                <Form-item prop="username" label="用户名">
                    <Input type="text" v-model="database.username" placeholder="请输入数据库链接密码">
                    </Input>
                </Form-item>
                <Form-item prop="password" label="密码">
                    <Input type="text" v-model="database.password" placeholder="请输入数据库链接密码">
                    </Input>
                </Form-item>
                <FormItem prop="type" label="数据库类型">
                    <Select v-model="database.type" placeholder="请选择项目类型" style="width: 100%">
                        <template v-for="sqlType in sqlTypeOptions">
                            <Option :value="sqlType">{{sqlType}}</Option>
                        </template>
                    </Select>
                </FormItem>
                <div style="text-align: right;width: 100%">
                    <Button @click="testSQL" type="primary">测试连接</Button>
                </div>
                <FormItem prop="type" label="项目类型">
                    <Select v-model="project.type" placeholder="请选择项目类型" style="width: 100%">
                        <template v-for="type in projectTypes">
                            <Option :value="type">{{type}}</Option>
                        </template>
                    </Select>
                </FormItem>
            </Form>
        </Modal>
        <!--删除项目-->
        <Modal v-model="showDeleteConfirm" title="请输入项目名称" @on-ok="confirmDelete"
               @on-cancel="()=>{showDeleteConfirm = false}">
            确定删除当前项目 ？ <br>
            <b>操作无法回复 建议先导出项目</b>
        </Modal>
    </div>
</template>
<style lang="less" scoped>
    .header {
        line-height: 60px;
        padding: 0 10px;
        position: relative;
        .save-to-local-btn, .sync-btn, .config-btn {
            cursor: pointer;
        }
        .save-to-local-btn {
            position: absolute;
            top: 10px;
            right: 120px;
        }
        .sync-btn {
            position: absolute;
            top: 10px;
            right: 70px;
        }
        .config-btn {
            position: absolute;
            top: 10px;
            right: 20px;
        }
    }
</style>
<script type="text/ecmascript-6">
  import {mapGetters, mapActions} from 'vuex'
  import * as types from '../../vuex/mutation-types'
  const defaultRows = require('@/config/default-row').default
  import Sequelize from 'sequelize'
  export default{
    data () {
      return {
        showModal: false,
        showImportFromSQLModal: true,
        sequelize: null,
        database: {
          type: 'mysql',
          address: 'localhost',
          port: '3306',
          name: 'mysql',
          username: 'root',
          password: ''
        },
        sqlTypeOptions: [
          'mysql',
          'postgres',
          'mssql'
        ],
        project: {
          name: '',
          type: 'laravel'
        },
        projectRule: {
          name: [
            {required: true, message: '请填写项目名', trigger: 'blur'}
          ],
          type: [
            {required: true, message: '请选择项目类型', trigger: 'change'}
          ]
        },
        databaseRule: {
          address: [
            {required: true, message: '请填写数据库链接地址', trigger: 'blur'}
          ],
          port: [
            {required: true, message: '请填写数据库链接地址', trigger: 'blur'}
          ],
          name: [
            {required: true, message: '请填写数据库链接地址', trigger: 'blur'}
          ]
        },
        showDeleteConfirm: false,
        projectName: ''
      }
    },
    computed: {
      projectTypes () {
        let typeList = []
        Object.keys(defaultRows).forEach(key => {
          typeList.push(key)
        })
        return typeList
      },
      ...mapGetters(['projectIndex'])
    },
    methods: {
      showAllTables () {
        this.sequelize.queryInterface && this.sequelize.queryInterface.showAllTables().then(tableName => {
          console.log(tableName)
        })
      },
      ...mapActions(['showNotice']),
      testSQL () {
        let _database = this.database
        this.sequelize = new Sequelize(`${_database.type}://${_database.username}:${_database.password}@${_database.address}:${_database.port}/${_database.name}`)
        this.sequelize
          .authenticate()
          .then(() => {
            console.log('Connection has been established successfully.')
            this.showAllTables()
          })
          .catch(err => {
            console.error('Unable to connect to the database:', err)
          })
      },
      confirmAdd () {
        if (this.project.name && this.project.type) {
          this.$store.commit(types.ADD_PROJECT, this.project)
        } else {
          this.showNotice({type: 'warning', desc: '项目名称和类型都是必填项'})
        }
      },
      confirmDelete () {
        let project = this.$store.getters.projectList[this.$store.getters.projectIndex]
        if (project && project.id) {
          this.$store.commit(types.DELETE_PROJECT, this.projectIndex)
          this.$store.commit(types.UPDATE_SELECT_INDEX, null)
          // 删除工作空间中储存的项目
          this.$project.syncDeleteProject(project)
          this.showNotice(`删除项目 ${project.name} 成功`)
        } else {
          this.showNotice({type: 'warning', desc: '没有项目可以删除 请先新建项目'})
        }
      }
    }
  }
</script>
