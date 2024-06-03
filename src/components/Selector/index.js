import styles from "./Selector.module.scss"

export const Selector = ({items, disabled=false, selected, onClick, type=0, selectedStyle={}, className="", parentStyle={display:'flex'}}) => {
  return <div style={parentStyle} className={`rounded-full ${styles.selector} ${type === 0 ? "rounded-xl" : styles.round} border  ${disabled ? 'opacity-20' : ''}`}>
    {
      items.map((item, i) => {
        return <div className={`${styles.item} ${className} ${selected == i ? styles.active : ''}`} 
          style={(selected == i && type === 1) ? selectedStyle : {}}
          key={item} 
          onClick={() => {
            if(!disabled) {
              return onClick(i)
            } else return null;
          }}
        >
          {
          item
          }
        </div>
      })
    } 
  </div>
}
