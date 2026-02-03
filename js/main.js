document.addEventListener('DOMContentLoaded', function() {
    initModal();



    let btns = document.querySelectorAll(".todo-app__delete, .todo-app__edit");


btns.forEach(btn => {
    btn.addEventListener("click", ()=>{

        alert("Будет реализованно позже");

    })
})

});