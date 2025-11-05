export function Logo() {
  return (
    <svg
      width="130"
      height="35"
      viewBox="0 0 130 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Voaya Logo"
    >
      <path
        d="M9.33333 1L1 18.25L9.33333 30H26L17.6667 18.25L26 1H9.33333Z"
        className="stroke-primary"
        strokeWidth="2"
      />
      <path
        d="M17.6667 18.25L26 1H34.3333L26 13.5L34.3333 26H26L17.6667 18.25Z"
        className="fill-primary"
      />
      <text
        x="40"
        y="21"
        fontFamily="Inter, sans-serif"
        fontSize="20"
        fontWeight="bold"
        className="fill-foreground"
      >
        VOAYA
      </text>
      <text
        x="40"
        y="33"
        fontFamily="Inter, sans-serif"
        fontSize="10"
        className="fill-muted-foreground"
      >
        Tu viaje, ya listo.
      </text>
    </svg>
  );
}
