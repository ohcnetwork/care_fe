export const validateName = (name: string) => {
  return name.length >= 3;
};

export const validatePassword = (password: string) => {
  const pattern =
    /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/;
  return pattern.test(password);
};
