import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, User } from 'lucide-react'

export default function PortalLayout() {
  const { user, profile, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projetoId = searchParams.get('projeto')

  const [isStaff, setIsStaff] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [portalConfig, setPortalConfig] = useState(null)
  const [portais, setPortais] = useState([])
  const [loadingPortais, setLoadingPortais] = useState(false)

  // Check if user is staff
  useEffect(() => {
    if (authLoading || !user) return

    const checkStaff = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_staff')
        .eq('id', user.id)
        .maybeSingle()

      const staff = data?.is_staff === true
      setIsStaff(staff)

      if (staff && !projetoId) {
        // Admin without ?projeto= → load all active portals
        setLoadingPortais(true)
        try {
          const { data: configs } = await supabase
            .from('portal_config')
            .select('projeto_id, cliente_nome, cliente_email, activo')
            .eq('activo', true)

          const projetoIds = (configs || []).map(c => c.projeto_id).filter(Boolean)

          let projetos = []
          if (projetoIds.length > 0) {
            const { data: projData } = await supabase
              .from('projetos')
              .select('id, codigo, nome')
              .in('id', projetoIds)
            projetos = projData || []
          }

          // Merge configs with projetos
          const merged = (configs || []).map(config => {
            const projeto = projetos.find(p => p.id === config.projeto_id)
            return {
              ...config,
              codigo: projeto?.codigo || '',
              nome: projeto?.nome || '',
            }
          }).filter(item => item.projeto_id)

          setPortais(merged)
        } catch (err) {
          console.error('Error loading portais:', err)
        }
        setLoadingPortais(false)
        setCheckingAccess(false)
        return
      }

      if (projetoId) {
        // Load specific portal config
        const { data: config } = await supabase
          .from('portal_config')
          .select('*')
          .eq('projeto_id', projetoId)
          .eq('activo', true)
          .maybeSingle()

        if (config) {
          setPortalConfig(config)
        } else if (!staff) {
          setPortalConfig(null)
        }
      }

      setCheckingAccess(false)
    }

    checkStaff()
  }, [user, authLoading, projetoId])

  // Loading state
  if (authLoading || checkingAccess || loadingPortais) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: "'Quattrocento Sans', sans-serif",
        color: '#78716C',
        fontSize: '14px',
      }}>
        A carregar...
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: "'Quattrocento Sans', sans-serif",
        color: '#78716C',
        fontSize: '16px',
      }}>
        Sem acesso
      </div>
    )
  }

  // Admin without ?projeto= → show portal selector
  if (isStaff && !projetoId) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAF9F6',
        padding: '48px 24px',
      }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#8B8670',
              marginBottom: '16px',
            }}>
              GAVINHO
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#1C1917',
              margin: '0 0 8px 0',
            }}>
              Selecionar portal para visualizar
            </h1>
            <p style={{
              fontFamily: "'Quattrocento Sans', sans-serif",
              fontSize: '14px',
              color: '#78716C',
              margin: 0,
            }}>
              Escolha o projecto para ver como o cliente
            </p>
          </div>

          {/* Portal cards grid */}
          {portais.length === 0 ? (
            <p style={{
              fontFamily: "'Quattrocento Sans', sans-serif",
              fontSize: '14px',
              color: '#78716C',
            }}>
              Nenhum portal activo encontrado.
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              {portais.map((portal) => (
                <div
                  key={portal.projeto_id}
                  onClick={() => navigate(`/portal?projeto=${portal.projeto_id}`)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E2D9',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {portal.codigo && (
                    <div style={{
                      fontFamily: "'Quattrocento Sans', sans-serif",
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#8B8670',
                      marginBottom: '4px',
                    }}>
                      {portal.codigo}
                    </div>
                  )}
                  <div style={{
                    fontFamily: "'Quattrocento Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1C1917',
                    marginBottom: '8px',
                  }}>
                    {portal.nome || 'Sem nome'}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Quattrocento Sans', sans-serif",
                    fontSize: '12px',
                    color: '#78716C',
                  }}>
                    <User size={12} style={{ flexShrink: 0 }} />
                    <span>
                      {portal.cliente_nome || 'Cliente'}
                      {portal.cliente_email ? ` \u00B7 ${portal.cliente_email}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Responsive: 1 column on mobile */}
          <style>{`
            @media (max-width: 640px) {
              div[style*="grid-template-columns: repeat(2"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {/* Back link */}
          <div style={{ marginTop: '32px' }}>
            <a
              href="/admin-portais"
              onClick={(e) => {
                e.preventDefault()
                navigate('/admin-portais')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Quattrocento Sans', sans-serif",
                fontSize: '14px',
                color: '#78716C',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1C1917' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#78716C' }}
            >
              <ArrowLeft size={16} />
              Voltar ao painel admin
            </a>
          </div>
        </div>
      </div>
    )
  }

  // No project selected and not staff → no access
  if (!projetoId && !isStaff) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: "'Quattrocento Sans', sans-serif",
        color: '#78716C',
        fontSize: '16px',
      }}>
        Sem acesso
      </div>
    )
  }

  // Has projetoId but no portal config found (and not staff)
  if (!portalConfig && !isStaff) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: "'Quattrocento Sans', sans-serif",
        color: '#78716C',
        fontSize: '16px',
      }}>
        Sem acesso
      </div>
    )
  }

  // Portal content placeholder (with projetoId)
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF9F6',
      padding: '48px 24px',
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        fontFamily: "'Quattrocento Sans', sans-serif",
      }}>
        <p style={{ color: '#78716C', fontSize: '14px' }}>
          Portal do projecto: {projetoId}
        </p>
      </div>
    </div>
  )
}
