// @ts-nocheck
// Assume these globals are available in the PowerPages runtime:
declare const shell: {
  getTokenDeferred(): JQuery.Promise<string>;
};

declare function validateLoginSession<T>(
  data: T,
  textStatus: string,
  jqXHR: JQuery.jqXHR,
  resolve: (value?: T | JQuery.Promise<T>) => void
): void;

/**
 * Custom HTTP wrapper function that handles authentication for the call from within PowerPages for you, making it all the easier to make API calls with {@link API}
 */
export default function safeAjax<T = any>(options: JQuery.AjaxSettings) {
  const deferredAjax = $.Deferred<T>();

  // shell is only available via runtime in a PowerPages portal

  shell
    .getTokenDeferred()
    .done(function (token) {
      // add headers for AJAX
      if (!options.headers) {
        $.extend(options, {
          headers: {
            __RequestVerificationToken: token,
          },
        });
      } else {
        options.headers["__RequestVerificationToken"] = token;
      }
      $.ajax(options)
        .done(function (data: any, textStatus: string, jqXHR: any) {
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
