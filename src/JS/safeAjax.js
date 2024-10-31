export default function safeAjax(ajaxOptions) {
  const deferredAjax = $.Deferred();

  // shell is only available via runtime in a PowerPages portal
  //eslint-disable-next-line
  shell
    .getTokenDeferred()
    .done(function (token) {
      // add headers for AJAX
      if (!ajaxOptions.headers) {
        $.extend(ajaxOptions, {
          headers: {
            __RequestVerificationToken: token,
          },
        });
      } else {
        ajaxOptions.headers["__RequestVerificationToken"] = token;
      }
      $.ajax(ajaxOptions)
        .done(function (data, textStatus, jqXHR) {
          //eslint-disable-next-line
          validateLoginSession(data, textStatus, jqXHR, deferredAjax.resolve);
        })
        .fail(deferredAjax.reject); //AJAX
    })
    .fail(function () {
      deferredAjax.rejectWith(this, arguments); // on token failure pass the token AJAX and args
    });

  return deferredAjax.promise();
}