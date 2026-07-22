# SONORA Web

English documentation: [README_EN.md](README_EN.md).

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

当前真实接入情况：

- `audio-assets`（`8030`）：JWT 登录、项目、上传、资产、任务、播放地址和删除。
- `audio-separator`（`8001`）：模型选择、分离任务、实时进度和分轨资产。
- `audio-analyzer`（`8020`）：分析任务、实时进度、统一 `analysis.json`、波形峰值和和弦时间轴。

前端向三个后端复用 `audio-assets` 签发的 Bearer Token。分离和分析任务标识会保存在浏览器本地，切换页面或刷新后可恢复轮询。

AI 生成、Agent 页面和首页部分内容仍属于界面预览或 mock 数据，尚未接入完整的持久资产链路。
