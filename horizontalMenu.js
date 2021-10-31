let hmbtns = [];
let currMsg = null;
let menus = 0;

const HorizontalMenu = buttons => {
	let icons = [];
	menus++;
	buttons.forEach(button => {
		btn = button;
		btn["menuID"] = menus;
		btn = {
			...btn,
			getMenu: () => $("#horizontalMenu" + menus),
			getMessage: () => $("#horizontalMenu" + menus).parent().parent().parent(),
			getMessageLine: () => $("#horizontalMenu" + menus).parent().find(".msg-flex .msgln")
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
