// click event on button with id 'dashboard'. window is referencing the current window, dash
// is the keyword for the const created in preload.js, and createDashboardWin() is the function
// in that const with the message to be transmitted in parenthesis. Is sending to main.js
document.getElementById('dashboard').addEventListener('click', ()=> {
     window.dash.createDashboardWin('dash')
})

// toggling button with id 'toggle_traking'. when turning on, it changes its value and the innerHTML
// and the message being sent to main.js (turning_on or turning_off)
document.getElementById('toggle_traking').addEventListener('click', ()=>{
     if (document.getElementById('toggle_traking').value=== 'off'){
          document.getElementById('toggle_traking').value= 'on'
          document.getElementById('toggle_traking').innerHTML='<input type="image" id="iogo1" src="icons/logoTemplate.png">Turn Traking OFF'
          window.traking.toggle('turning_on')
     }else{
          document.getElementById('toggle_traking').value='off'
          document.getElementById('toggle_traking').innerHTML='<input type="image" id="iogo1" src="icons/logoTemplate.png">Turn Traking ON'
          window.traking.toggle('turning_off')
     } 
})

// when this button is clicked, window closes and app quits (is sending message to main.js)
document.getElementById('close_btn').addEventListener('click',()=>{
     window.closingApp.closeApp('closing_App')
})