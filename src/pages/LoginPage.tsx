import { ArrowLeft, AudioLines, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const [register, setRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, ready, login, register: createAccount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (register) {
        await createAccount({ username, email, password })
      } else {
        await login(email, password)
      }
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '请求失败，请稍后重试'
      setError(message === 'invalid username or password' ? '用户名、邮箱或密码不正确' : message)
    } finally {
      setSubmitting(false)
    }
  }

  if (ready && user) return <Navigate to="/" replace />

  return (
    <div className="login-page">
      <section className="login-showcase">
        <Link to="/" className="login-brand"><span><AudioLines size={21} /></span>SONORA</Link>
        <div className="login-visual">
          <span className="login-orb"><AudioLines size={38} /></span>
          <div className="login-wave">{[22, 52, 74, 35, 88, 54, 96, 43, 68, 29, 80, 46, 62].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
          <span className="login-chip chip-one"><small>BPM</small>92</span>
          <span className="login-chip chip-two"><small>KEY</small>F♯ minor</span>
        </div>
        <div className="login-quote"><Sparkles size={16} /><h1>听见声音的每一层，<br />创造下一种可能。</h1><p>从音频素材到完整作品，一个工作空间完成。</p></div>
      </section>
      <section className="login-form-side">
        <Link to="/" className="back-home"><ArrowLeft size={15} /> 返回工作台</Link>
        <form className="login-form" onSubmit={submit}>
          <span className="eyebrow">WELCOME TO SONORA</span>
          <h2>{register ? '创建你的工作空间' : '欢迎回来'}</h2>
          <p>{register ? '注册后会自动创建一个 Default Project。' : '登录以继续你的音乐创作。'}</p>
          {register && <label><span>用户名</span><div><AudioLines size={16} /><input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="你的用户名" /></div></label>}
          <label><span>{register ? '邮箱' : '用户名或邮箱'}</span><div><Mail size={16} /><input required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" type={register ? 'email' : 'text'} placeholder={register ? 'name@example.com' : '输入用户名或邮箱'} /></div></label>
          <label><span>密码</span><div><LockKeyhole size={16} /><input required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} placeholder="输入密码" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {!register && <div className="login-options"><label><input type="checkbox" /> 记住我</label><button type="button">忘记密码？</button></div>}
          {error && <div className="login-error">{error}</div>}
          <button className="login-submit" type="submit" disabled={submitting}>{submitting ? '正在连接...' : register ? '创建账户' : '登录并继续'}</button>
          <div className="login-switch">{register ? '已经有账户？' : '还没有账户？'}<button type="button" onClick={() => setRegister(!register)}>{register ? '直接登录' : '创建账户'}</button></div>
          <small className="login-demo-note">账户与登录状态由 audio-assets JWT 接口管理。</small>
        </form>
      </section>
    </div>
  )
}
