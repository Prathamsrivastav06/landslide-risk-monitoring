def calculate_metrics(y_true, y_pred, y_prob=None):
    from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
    
    metrics = {}
    metrics['precision'] = precision_score(y_true, y_pred, zero_division=0)
    metrics['recall'] = recall_score(y_true, y_pred, zero_division=0)
    metrics['f1'] = f1_score(y_true, y_pred, zero_division=0)
    
    if y_prob is not None:
        try:
            metrics['roc_auc'] = roc_auc_score(y_true, y_prob)
        except Exception:
            metrics['roc_auc'] = None
            
    metrics['confusion_matrix'] = confusion_matrix(y_true, y_pred).tolist()
    return metrics
