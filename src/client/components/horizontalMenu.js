let horizontalMenuButtons = [];
let menus = 0;
function horizontalMenuAddButtons(menu, buttons, a = true) {
	let buttonsHTML = "";
	buttons.forEach(function(button) {
		let m = menu;
		button = {
			...button,
			menuID: m,
			getMenu: function() { return $("#horizontalMenu" + m) },
			getMessage: function() { return $("#horizontalMenu" + m).parent().parent().parent().parent() },
			getMessageLine: function() { return $("#horizontalMenu" + menus).parent().find(".msg-flex .msgln") }
		};
		horizontalMenuButtons.push(button);
		buttonsHTML += `<div class="horizontalMenuItem no-select" onclick="horizontalMenuButtons[${horizontalMenuButtons.length - 1}]['click'](horizontalMenuButtons[${horizontalMenuButtons.length - 1}])"><i class="megasmall material-icons">${button.icon}</i></div>\n`;
	});
	if(a) {
		$("#horizontalMenu" + menu).append(buttonsHTML);
	}
	else {
		return buttonsHTML;
	}
}
const HorizontalMenu = function(buttons) {
	menus++;
	let buttonsHTML = horizontalMenuAddButtons(menus, buttons, false);
	return `
		<div class="horizontalMenu" id="horizontalMenu${menus}" data-id="${menus}">
			${buttonsHTML}
		</div>
	`;
};
