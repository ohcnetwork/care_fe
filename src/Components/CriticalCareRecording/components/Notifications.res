type props = {msg: string}

@module("../../../Utils/Notifications.js") external success: props => unit = "Success"
@module("../../../Utils/Notifications.js") external error: props => unit = "Error"
@module("../../../Utils/Notifications.js") external badRequest: props => unit = "BadRequest"
