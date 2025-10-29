export const toTitleCase = (str: string) => {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export const getInputWidth = (text: string) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = '12px Inter, sans-serif';
    const metrics = context.measureText(text);
    return Math.max(60, Math.ceil(metrics.width) + 38);
  }
  return Math.max(60, text.length * 8 + 38);
};

export const getBadgeWidth = (text: string) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = '400 12px Inter, sans-serif';
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width) + 18;
  }
  return text.length * 7 + 18;
};

export const renderSourcesOrCollections = (
  cardId: string,
  items: string[],
  type: 'source' | 'collect',
  maxWidth: number,
  expandedSources: Set<string>,
  expandedCollections: Set<string>
) => {
  const isExpanded = type === 'source' ? expandedSources.has(cardId) : expandedCollections.has(cardId);
  const gap = 6;
  const plusButtonWidth = 60;
  
  if (isExpanded) {
    const itemWidths: number[] = items.map(item => getBadgeWidth(item));
    
    let line1Width = 0;
    let line2Width = 0;
    let itemsToShow = 0;

    for (let i = 0; i < items.length; i++) {
      const itemWidth = itemWidths[i];
      
      if (line1Width === 0) {
        line1Width = itemWidth;
        itemsToShow++;
      } else if (line1Width + gap + itemWidth <= maxWidth) {
        line1Width += gap + itemWidth;
        itemsToShow++;
      } else if (line2Width === 0) {
        line2Width = itemWidth;
        itemsToShow++;
      } else if (line2Width + gap + itemWidth + gap + plusButtonWidth <= maxWidth) {
        line2Width += gap + itemWidth;
        itemsToShow++;
      } else {
        break;
      }
    }
    
    const hiddenCount = items.length - itemsToShow;
    return { itemsToShow, hiddenCount };
  }
  
  const maxAllowedWidth = maxWidth * 0.75;
  const itemWidths: number[] = items.map(item => getBadgeWidth(item));

  let currentWidth = 0;
  let itemsToShow = 0;

  for (let i = 0; i < items.length; i++) {
    const itemWidth = itemWidths[i];
    const isLastItem = i === items.length - 1;
    
    if (currentWidth === 0) {
      currentWidth = itemWidth;
      itemsToShow++;
    } else if (currentWidth + gap + itemWidth <= maxAllowedWidth) {
      currentWidth += gap + itemWidth;
      itemsToShow++;
    } else if (!isLastItem && currentWidth + gap + plusButtonWidth <= maxAllowedWidth) {
      break;
    } else {
      break;
    }
  }

  const hiddenCount = items.length - itemsToShow;
  return { itemsToShow, hiddenCount };
};

