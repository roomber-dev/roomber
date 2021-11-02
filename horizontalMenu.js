let hmbtns = [];
let currMsg = null;
let menus = 0;

const HorizontalMenu = function(buttons) {
	let icons = "";
	menus++;
	buttons.forEach(function(button) {
		let m = menus;
		let btn = {
			...button,
			menuID: m,
			getMenu: function() { return $("#horizontalMenu" + m) },
			getMessage: function() { $("#horizontalMenu" + m).parent().parent().parent() },
			getMessageLine: function() { $("#horizontalMenu" + menus).parent().find(".msg-flex .msgln") }
		};
		hmbtns.push(btn);
		icons += `<div class="horizontalMenuItem" onclick="hmbtns[${hmbtns.length - 1}]['click'](hmbtns[${hmbtns.length - 1}])"><i class="material-icons">${button.icon}</i></div>\n`;
	});
	return `
		<div class="horizontalMenu" id="horizontalMenu${menus}">
			${icons}
		</div>
	`;
};
