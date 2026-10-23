import SpotlightCard from '../bits/SpotlightCard';
import Icon from '../components/Icon';

/** Shared card shell: spotlight hover glow, title row and optional actions. */
export default function Widget({ title, icon, actions, className = '', tour, children, theme, color }) {
  return (
    <SpotlightCard
      className={`widget ${className}`}
      theme={theme}
      spotlightColor={color}
      intensity={0.12}
      spotlightSize={320}
      borderGlow={0.8}
      data-tour={tour}
    >
      <header className="widget-head">
        <h2 className="widget-title">
          {icon && <Icon name={icon} size={16} />} {title}
        </h2>
        {actions && <div className="widget-actions">{actions}</div>}
      </header>
      <div className="widget-body">{children}</div>
    </SpotlightCard>
  );
}
