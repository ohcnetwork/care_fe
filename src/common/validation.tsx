export const validateName = (name: string) => {
  return name.length >= 3;
};

export const validatePassword = (password: string) => {
  const pattern =
    /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/;
  return pattern.test(password);
};

export const validateAge = (age: number) => {
  return age > 0 && age <= 120;
};

export const validateUsername = (username: string) => {
  const usernameRegex = /^(?!.*[_-]{2})(?=^[a-z0-9][a-z0-9_-]{2,14}[a-z0-9]$)/;
  return usernameRegex.test(username);
};
