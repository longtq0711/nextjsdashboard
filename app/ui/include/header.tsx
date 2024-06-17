
export default async function Header() {
  return (
    <div className="header_container">
      <div className="header_logo">
        <a className="linkButton" data-testid="a" href="/wb">
          <div className="linkButton_container linkButton_containerHover" data-testid="div">WhiteBoard
          </div>
        </a>
      </div>
      <div className="header_staffWorkMenu">
        <div className="dropDownWorkMenu_container">
          <div className="linkButton_container" data-testid="div">出勤▼</div>
        </div>
      </div>
      <div className="header_staffLocationFloorSelector">
        <div>
          <div className="basic-single reactSelect_container">
            <span aria-live="polite" aria-atomic="false" aria-relevant="additions text" className="css-7pg0cj-a11yText"></span>
            <div className="select__control css-yk16xz-control">
              <div className="select__value-container select__value-container--has-value">
                <div className="select__single-value css-1uccc91-singleValue">D棟３F 次世代ソリューション 237
                </div>
                <div className="css-1g6gooi">
                  <div className="select__input">
                    <input type="text" aria-autocomplete="list" value=""  />
                      <div></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="select__indicators css-1wy0on6">
              <span className="select__indicator-separator css-1okebmr-indicatorSeparator"></span>
              <div className="select__indicator select__dropdown-indicator css-tlfecz-indicatorContainer" aria-hidden="true">
                <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="css-8mmkcg"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}