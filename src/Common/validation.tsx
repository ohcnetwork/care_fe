export const phonePreg = (phone: string) => {
    const pattern = /^((\+91|91|0)[\- ]{0,1})?[456789]\d{9}$/;
    return pattern.test(phone);
};

export const validateLocationCoordinates = (location: string) => {
    const pattern = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/;
    return pattern.test(location);
};

export const validateEmailAddress = (email: string) => {
    const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(email);
};

export const getArrayValueByKey = (arr: Array<any>, attr: string, value: string | number) => {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][attr] == value) {
            return i;
        }
    }
    return -1;
};

export const getRandomNumbers = (min: number, max: number) => {
    return Math.floor(Math.random() * max) + min;
};

export const validateUsername = (username: string) => {
    const pattern = /^[\w.@+-]+[^.@+-_]$/;
    return pattern.test(username);
};

export const validatePassword = (password: string) => {
    const pattern = /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/;
    return pattern.test(password);
}