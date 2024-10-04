const Facebook = ({ ...props }) => {
  return (
    <svg
      width="45"
      height="45"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      class={props.className}
    >
      <path
        d="M12.8 9h-2.5v9H6.6V9H4.9V5.8h1.8v-2C6.6 2.3 7.3 0 10.4 0h2.8v3.1h-2c-.3 0-.8.2-.8.9v1.9h2.8L12.8 9z"
        fill="#1196F5"
      />
    </svg>
  );
};

export default Facebook;
