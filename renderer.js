const switch_html = document.getElementById("switch-round");
const test = document.getElementById("slider-round")
const notification = document.getElementById("alert-container");
const token = document.getElementById("token-input")

console.log(switch_html)

switch_html.addEventListener('change', function() {
    if (this.checked) {
        console.log("test")
        RPCStatus.login(token.value)
        token.disabled = true
    } else {
        console.log("test2")
        RPCStatus.logout()
        token.disabled = false
    }
});

test.addEventListener('mouseenter', function() {
    if (switch_html.disabled == true) {
        console.log(test.style.cursor)
        test.style.cursor = "not-allowed";
    }
})

function changeSwitchState(state) {
    console.log("Switch changing")
    switch_html.disabled = !switch_html.disabled
    notification.hidden = !notification.hidden
}


RPCStatus.SwitchState(changeSwitchState)
