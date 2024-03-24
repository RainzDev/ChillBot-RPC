const switch_html = document.getElementById("switch-round");

console.log(switch_html)

switch_html.addEventListener('change', function() {
    if (this.checked) {
        console.log("test")
        RPCStatus.login()
    } else {
        console.log("test2")
        RPCStatus.logout()
    }
});