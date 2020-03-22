export const phone_preg = (phone: string) => {
    const pattern = /^((\+91|91|0)[\- ]{0,1})?[456789]\d{9}$/
    return pattern.test(phone)
}

export const validateLocationCoordinates = (location:string) => {
    const pattern = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/
    return pattern.test(location)
}