import { Check, ChevronRight, CircleAlert, LoaderCircle, MoreHorizontal, Play, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../data/mockData'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  )
}

export function SectionHeader({ title, description, href, linkLabel = '查看全部' }: { title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-header">
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {href && <Link to={href}>{linkLabel}<ChevronRight size={16} /></Link>}
    </div>
  )
}

export function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  return (
    <Link to="/studio" className={`project-card ${compact ? 'compact' : ''}`}>
      <div className={`project-cover ${project.cover}`}>
        <div className="cover-orbit orbit-one" />
        <div className="cover-orbit orbit-two" />
        <button aria-label="播放项目"><Play size={17} fill="currentColor" /></button>
      </div>
      <div className="project-info">
        <div className="project-title-row"><h3>{project.name}</h3><MoreHorizontal size={18} /></div>
        <p>{project.description}</p>
        <div><span>{project.assetCount} 个资产</span><i /> <span>{project.updatedAt}</span></div>
      </div>
    </Link>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const icon = status === '已完成' ? <Check size={12} /> : status === '运行中' || status === '排队中' ? <LoaderCircle size={12} /> : <CircleAlert size={12} />
  return <span className={`status-badge status-${status}`}>{icon}{status}</span>
}

export function NewProjectCard() {
  return <button className="new-project-card"><span><Plus size={22} /></span><strong>新建项目</strong><p>把一次创作的素材与结果组织在一起</p></button>
}
