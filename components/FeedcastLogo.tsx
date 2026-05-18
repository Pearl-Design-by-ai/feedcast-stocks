interface FeedcastLogoProps {
  size?: number;
  className?: string;
}

export function FeedcastLogo({ size = 24, className }: FeedcastLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Feedcast logo"
    >
      <circle cx="12" cy="1.2" r="0.9"/><circle cx="14.8" cy="1.57" r="0.9"/><circle cx="17.4" cy="2.65" r="0.9"/><circle cx="19.64" cy="4.36" r="0.9"/><circle cx="21.35" cy="6.6" r="0.9"/><circle cx="22.43" cy="9.2" r="0.9"/><circle cx="22.8" cy="12" r="0.9"/><circle cx="22.43" cy="14.8" r="0.9"/><circle cx="21.35" cy="17.4" r="0.9"/><circle cx="19.64" cy="19.64" r="0.9"/><circle cx="17.4" cy="21.35" r="0.9"/><circle cx="14.8" cy="22.43" r="0.9"/><circle cx="12" cy="22.8" r="0.9"/><circle cx="9.2" cy="22.43" r="0.9"/><circle cx="6.6" cy="21.35" r="0.9"/><circle cx="4.36" cy="19.64" r="0.9"/><circle cx="2.65" cy="17.4" r="0.9"/><circle cx="1.57" cy="14.8" r="0.9"/><circle cx="1.2" cy="12" r="0.9"/><circle cx="1.57" cy="9.2" r="0.9"/><circle cx="2.65" cy="6.6" r="0.9"/><circle cx="4.36" cy="4.36" r="0.9"/><circle cx="6.6" cy="2.65" r="0.9"/><circle cx="9.2" cy="1.57" r="0.9"/>
      <circle cx="13.14" cy="3.37" r="0.66"/><circle cx="15.33" cy="3.96" r="0.66"/><circle cx="17.3" cy="5.1" r="0.66"/><circle cx="18.9" cy="6.7" r="0.66"/><circle cx="20.04" cy="8.67" r="0.66"/><circle cx="20.63" cy="10.86" r="0.66"/><circle cx="20.63" cy="13.14" r="0.66"/><circle cx="20.04" cy="15.33" r="0.66"/><circle cx="18.9" cy="17.3" r="0.66"/><circle cx="17.3" cy="18.9" r="0.66"/><circle cx="15.33" cy="20.04" r="0.66"/><circle cx="13.14" cy="20.63" r="0.66"/><circle cx="10.86" cy="20.63" r="0.66"/><circle cx="8.67" cy="20.04" r="0.66"/><circle cx="6.7" cy="18.9" r="0.66"/><circle cx="5.1" cy="17.3" r="0.66"/><circle cx="3.96" cy="15.33" r="0.66"/><circle cx="3.37" cy="13.14" r="0.66"/><circle cx="3.37" cy="10.86" r="0.66"/><circle cx="3.96" cy="8.67" r="0.66"/><circle cx="5.1" cy="6.7" r="0.66"/><circle cx="6.7" cy="5.1" r="0.66"/><circle cx="8.67" cy="3.96" r="0.66"/><circle cx="10.86" cy="3.37" r="0.66"/>
      <circle cx="13.03" cy="5.48" r="0.48"/><circle cx="15" cy="6.12" r="0.48"/><circle cx="16.67" cy="7.33" r="0.48"/><circle cx="17.88" cy="9" r="0.48"/><circle cx="18.52" cy="10.97" r="0.48"/><circle cx="18.52" cy="13.03" r="0.48"/><circle cx="17.88" cy="15" r="0.48"/><circle cx="16.67" cy="16.67" r="0.48"/><circle cx="15" cy="17.88" r="0.48"/><circle cx="13.03" cy="18.52" r="0.48"/><circle cx="10.97" cy="18.52" r="0.48"/><circle cx="9" cy="17.88" r="0.48"/><circle cx="7.33" cy="16.67" r="0.48"/><circle cx="6.12" cy="15" r="0.48"/><circle cx="5.48" cy="13.03" r="0.48"/><circle cx="5.48" cy="10.97" r="0.48"/><circle cx="6.12" cy="9" r="0.48"/><circle cx="7.33" cy="7.33" r="0.48"/><circle cx="9" cy="6.12" r="0.48"/><circle cx="10.97" cy="5.48" r="0.48"/>
      <circle cx="12.89" cy="7.44" r="0.3"/><circle cx="14.57" cy="8.12" r="0.3"/><circle cx="15.86" cy="9.4" r="0.3"/><circle cx="16.56" cy="11.07" r="0.3"/><circle cx="16.56" cy="12.89" r="0.3"/><circle cx="15.88" cy="14.57" r="0.3"/><circle cx="14.6" cy="15.86" r="0.3"/><circle cx="12.93" cy="16.56" r="0.3"/><circle cx="11.11" cy="16.56" r="0.3"/><circle cx="9.43" cy="15.88" r="0.3"/><circle cx="8.14" cy="14.6" r="0.3"/><circle cx="7.44" cy="12.93" r="0.3"/><circle cx="7.44" cy="11.11" r="0.3"/><circle cx="8.12" cy="9.43" r="0.3"/><circle cx="9.4" cy="8.14" r="0.3"/><circle cx="11.07" cy="7.44" r="0.3"/>
    </svg>
  );
}
