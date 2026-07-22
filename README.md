# SONORA Web

音频智能创作平台的统一前端。当前版本覆盖：

- 首页与创作入口
- AI 音乐生成
- 音频分离、分析与处理工作台
- Agent 工作流对话
- 项目、资产与任务管理
- `audio-assets` JWT 登录、注册和登录状态恢复
- 真实项目列表、默认项目和项目创建
- 真实资产列表、MinIO 上传和数据库/MinIO 联动删除

## 技术栈

- React 19 + TypeScript
- Vite
- React Router
- Lucide Icons
- Conda 环境：`audio-frontend`

## 本地启动

```bash
./scripts/start_dev.sh
```

浏览器访问：`http://127.0.0.1:8040`

需要后台常驻时：

```bash
./scripts/tmux_dev.sh
```

## 后端对接

复制 `.env.example` 为 `.env.local` 后可调整各服务地址。

用户、项目和资产页面已经接入 `audio-assets`。音轨分离、音乐分析、AI 生成、Agent 和任务中心仍是界面预览，后续再接入对应服务。
