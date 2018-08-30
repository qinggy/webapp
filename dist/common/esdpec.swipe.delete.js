$jQuery.namespace('esdpec.framework.core');

esdpec.framework.core.swipeDelete = function (select, deleteBtn, deleteAction) {
  var itembox = Array.prototype.slice.call(document.querySelectorAll(select), 0);

  itembox.forEach(function (item, index, arr) {
    var startX, endX, movebox = item;

    function boxTouchStart(e) {
      var touch = e.touches[0];
      startX = touch.pageX;
    }

    function boxTouchMove(e) {
      var touch = e.touches[0];
      endX = touch.pageX;
    }

    function boxTouchEnd(e) {
      if (startX - endX >= 100) {
        // console.dir(itembox);
        $jQuery(itembox).removeClass('active');
        this.classList.add("active");
      } else {
        this.classList.remove("active");
      }
    }
    movebox.addEventListener("touchstart", boxTouchStart, false);
    movebox.addEventListener("touchmove", boxTouchMove, false);
    movebox.addEventListener("touchend", boxTouchEnd, false);

    movebox.querySelector(deleteBtn).onclick = function (e) {
      e.stopPropagation();
      var deleteId = $jQuery(e.currentTarget).attr('data-id');
      if (deleteAction) deleteAction(deleteId);
    }
  });
};