export default function VaultLogo({ size = 34, open = false }) {
  return (
    <div className={`group relative select-none ${open ? 'vault-open' : ''}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-vault-violet to-vault-cyan shadow-lg shadow-vault-violet/40" />
      <div className="absolute inset-[3px] rounded-lg bg-ink/90" />
      <div className="absolute inset-[3px] flex items-center justify-center rounded-lg">
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-vault-violet to-vault-cyan shadow-[0_0_12px_2px_rgba(124,58,237,.8)]" />
      </div>
      <div className="vault-door absolute inset-[3px] overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[55%] w-[55%] rounded-full border-2 border-white/25">
            <div className="absolute inset-0 m-auto h-[30%] w-[30%] rounded-full border border-white/20 bg-white/10" />
            <div className="absolute inset-0 m-auto h-[2px] w-[55%] bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  )
}