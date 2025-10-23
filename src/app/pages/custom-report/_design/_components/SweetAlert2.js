import { useEffect, useRef, useState } from "react";

const SweetAlert2Component = ({
    title,
    children,
    showConfirmButton = true,
    showDenyButton = false,
    showCancelButton = true,
    confirmButtonText = "OK",
    denyButtonText = "No",
    cancelButtonText = "Cancel",
    preConfirm = () => true,
    confirm = () => {},
    preDeny = () => true,
    deny = () => {},
    cancel = () => {},
    hide = () => {}
}) => {

    const [hidden, setHidden] = useState(false);
    const swal2ContainerRef = useRef(null);
    const swal2PopupRef = useRef(null);
    const swal2TitleRef = useRef(null);
    const swal2HtmlContainerRef = useRef(null);
    const swal2ActionsRef = useRef(null);

    const swalHide = async () => {
        setHidden(true)
        setTimeout(() => {
            hide()
        }, 250);
    }

    const swalCancel = () => {
        cancel()
        swalHide()
    }

    const swalConfirm = () => {
        const { ok, message } = preConfirm();
        if(ok){
            confirm()
            swalHide()
        }
    }
    
    useEffect(() => {
        const onClickOutside = (e) => {
            if(swal2PopupRef.current && !swal2PopupRef.current.contains(e.target)) {
                swalHide();
            }
        }

        document.addEventListener("click", onClickOutside);
        return () => {
            document.removeEventListener("click", onClickOutside);
        }
    }, [])

    return (
        <div
            ref={swal2ContainerRef}
            className={`swal2-container swal2-center  ${hidden ? "swal2-backdrop-hide" : "swal2-backdrop-show"}`}
            style={{
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
            }}
        >
            <div
                ref={swal2PopupRef}
                className={`swal2-popup swal2-modal ${hidden ? "swal2-hide" : "swal2-show"} grid`}
                tabIndex="-1"
            >
                <h2
                    ref={swal2TitleRef}
                    className="swal2-title block"
                >
                    {title}
                </h2>
                <div
                    ref={swal2HtmlContainerRef}
                    className="swal2-html-container block"
                >
                    {children}
                </div>
                <div
                    ref={swal2ActionsRef}
                    className="swal2-actions flex"
                >
                    {showConfirmButton && (
                        <button
                            type="button"
                            className="swal2-confirm swal2-styled inline-block"
                            onClick={() => {
                                const ok = preConfirm();
                                if(ok) confirm();
                                swalHide();
                            }}
                        >
                            {confirmButtonText}
                        </button>
                    )}
                    {showDenyButton && (
                        <button
                            type="button"
                            className="swal2-deny swal2-styled inline-block"
                            onClick={() => {
                                const ok = preDeny();
                                if(ok) deny();
                                swalHide();
                            }}
                        >
                            {denyButtonText}
                        </button>
                    )}
                    {showCancelButton && (
                        <button
                            type="button"
                            className="swal2-cancel swal2-styled inline-block"
                            onClick={swalCancel}
                        >
                            {cancelButtonText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SweetAlert2Component