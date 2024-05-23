import Button from "./Button";

type Props = {
  children: (string | JSX.Element)[] | string | JSX.Element;
};

const DisabledSubmitButton = ({ children }: Props) => {
  return (
    <>
      <Button id="initial-btn">{children}</Button>
      <Button isLoading className="hidden" id="loading-btn" disabled>
        {children}
      </Button>
    </>
  );
};

export default DisabledSubmitButton;