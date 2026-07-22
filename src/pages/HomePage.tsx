import { ArrowUpRight, AudioLines, Bot, FileAudio, Music2, ScanSearch, Sparkles, Split, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProjectCard, SectionHeader, StatusBadge } from '../components/Shared'
import { quickActions, recentTasks } from '../data/mockData'
import { useProjects } from '../hooks/useProjects'

const actionIcons = {
  split: Split,
  analysis: ScanSearch,
  sparkles: Sparkles,
  agent: Bot,
}

export function HomePage() {
  const { projects, loading } = useProjects()
  return (
    <div className="home-page">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">TUESDAY · 21 JUL</span>
          <h1>下午好，准备创造点什么？</h1>
          <p>从一段声音开始，分离、理解，然后创造新的音乐。</p>
        </div>
        <Link className="secondary-button" to="/library"><Upload size={17} /> 上传音频</Link>
      </section>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-pill"><Sparkles size={14} /> 智能创作工作流</span>
          <h2>一句话，把灵感变成<br />可以播放的作品</h2>
          <p>告诉 Agent 你想做什么。它会自动选择分离、分析与生成工具，并保存完整的资产关系。</p>
          <div className="hero-actions">
            <Link className="primary-button light" to="/assistant">和 Agent 对话 <ArrowUpRight size={17} /></Link>
            <Link className="text-button light" to="/studio">进入音频工作台</Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-disc"><Music2 size={34} /><i /></div>
          <div className="hero-wave">
            {[24, 44, 70, 38, 78, 52, 92, 66, 32, 58, 84, 48, 72, 28, 54, 76, 40, 62].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
          <span className="floating-chip chip-key"><small>KEY</small>F# minor</span>
          <span className="floating-chip chip-bpm"><small>BPM</small>92</span>
          <span className="floating-chip chip-chord"><AudioLines size={14} /> F#m7 · A · E</span>
        </div>
      </section>

      <section className="quick-section">
        <SectionHeader title="从这里开始" description="选择一种方式开启你的工作流" />
        <div className="quick-grid">
          {quickActions.map((action) => {
            const Icon = actionIcons[action.icon as keyof typeof actionIcons]
            return (
              <Link to={action.href} className={`quick-card tone-${action.tone}`} key={action.title}>
                <span className="quick-icon"><Icon size={21} /></span>
                <div><h3>{action.title}</h3><p>{action.description}</p></div>
                <ArrowUpRight size={18} className="quick-arrow" />
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <SectionHeader title="最近项目" href="/projects" />
        <div className="project-grid home-projects">
          {projects.slice(0, 3).map((project, index) => <ProjectCard key={project.project_id} project={{
            id: project.project_id,
            name: project.name,
            description: project.description || '暂无项目描述',
            assetCount: project.assets.length,
            updatedAt: new Date(project.updated_at).toLocaleDateString('zh-CN'),
            cover: ['cover-a', 'cover-b', 'cover-c'][index % 3],
            status: project.is_default ? '默认项目' : undefined,
          }} compact />)}
          {loading && <div className="project-loading"><span className="spinner" />正在读取你的项目</div>}
        </div>
      </section>

      <section className="activity-section">
        <SectionHeader title="任务流程预览" description="分离、分析与生成后端接通后会显示真实任务" href="/tasks" />
        <div className="task-list compact-task-list">
          {recentTasks.slice(0, 3).map((task) => (
            <div className="task-row" key={task.id}>
              <div className="task-file-icon"><FileAudio size={18} /></div>
              <div className="task-main"><strong>{task.name}</strong><span>{task.file}</span></div>
              {task.status === '运行中' && <div className="task-progress"><i style={{ width: `${task.progress}%` }} /></div>}
              <span className="task-time">{task.time}</span>
              <StatusBadge status={task.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
